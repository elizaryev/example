using System;
using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using EnsureThat;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using TokenManager.Entities;
using System.Collections.Generic;
using TokenManager.Context;

namespace TokenManager.BussinessLogic
{
    public class TokenManagerService: ITokenManagerService
    {
        private static ConcurrentDictionary<string, Dictionary<string, object>> _storageTokens = new ConcurrentDictionary<string, Dictionary<string, object>>();
        private readonly TokenManagerServiceSettings _tokenManagerSettings;
        private readonly IDumpStorageContext _dumpStorageContext;

        public TokenManagerService(IOptions<TokenManagerServiceSettings> tokenManagerSettings, IDumpStorageContext dumpStorageContext)
        {
            _dumpStorageContext = dumpStorageContext;
            _tokenManagerSettings = tokenManagerSettings.Value;

            _storageTokens = _dumpStorageContext.Load();
        }

        public async Task<string> GenerateToken(string emailAddress, Dictionary<string, object> parameters, DateTime? expires = null)
        {
            #region ensure block
            Ensure.That(emailAddress).IsNotNullOrEmpty();
            #endregion ensure block
            
            byte[] key = Convert.FromBase64String(_tokenManagerSettings.SecretKey);
            SymmetricSecurityKey securityKey = new SymmetricSecurityKey(key);
            SecurityTokenDescriptor descriptor = new SecurityTokenDescriptor
            {
                Audience = _tokenManagerSettings.ValidAudience,
                Issuer = _tokenManagerSettings.ValidIssuer,
                Subject = new ClaimsIdentity(new[] {
                    new Claim(ClaimTypes.Name, emailAddress)}),
                //Expires = expires ?? DateTime.UtcNow.AddMinutes(tokenExpiresMin),
                SigningCredentials = new SigningCredentials(securityKey,
                    SecurityAlgorithms.HmacSha256Signature)
            };

            JwtSecurityTokenHandler handler = new JwtSecurityTokenHandler();
            JwtSecurityToken token = handler.CreateJwtSecurityToken(descriptor);
            string rawToken = handler.WriteToken(token);

            var initExpires = expires ??
                              (double.TryParse(_tokenManagerSettings.TokenExpiresMin,
                                  out var tokenExpiresMin)
                                  ? DateTime.Now.AddMinutes(tokenExpiresMin)
                                  : (DateTime?)null);
            if (parameters == null)
            {
                parameters = new Dictionary<string, object>();
            }
            parameters.Add("expires", initExpires);

            if (_storageTokens.TryAdd(rawToken, parameters))
            {
                await _dumpStorageContext.Update(_storageTokens);
                return rawToken;
            }
            else
            {
                Log.Error($"Cannot add token to storage for email address:[{emailAddress}]");
                throw new OperationException($"Cannot add token to storage for email address:[{emailAddress}]");
            }
        }

        private ClaimsPrincipal GetPrincipal(string token)
        {
            try
            {
                JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();
                JwtSecurityToken jwtToken = (JwtSecurityToken)tokenHandler.ReadToken(token);
                if (jwtToken == null)
                    return null;
                byte[] key = Convert.FromBase64String(_tokenManagerSettings.SecretKey);
                TokenValidationParameters parameters = new TokenValidationParameters()
                {
                    ValidAudience = _tokenManagerSettings.ValidAudience,
                    ValidIssuer = _tokenManagerSettings.ValidIssuer,
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    RequireExpirationTime = false,
                    ValidateLifetime = false,
                    //LifetimeValidator = CustomLifetimeValidator,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuerSigningKey = true,
                    ClockSkew = TimeSpan.Zero
                };
                ClaimsPrincipal principal = tokenHandler.ValidateToken(token,
                    parameters, out _);
                return principal;
            }
            catch (Exception e)
            {
                Log.Error(e, $"Error for get principal of token:[{token}]");
                return null;
            }
        }

        public async Task<string> ValidateToken(string token)
        {
            #region ensure block
            Ensure.That(token).IsNotNullOrEmpty();
            #endregion ensure block
            
            if (!_storageTokens.TryGetValue(token, out var parameters))
            {
                Log.Error($"Cannot find token [{token}] in storage!");
                return null;
            }

            var expirationTime = ((DateTime?) parameters["expires"]);
            if (expirationTime.HasValue)
            {
                TimeSpan tsNow = new TimeSpan(DateTime.Now.Ticks);
                TimeSpan tsExpire = new TimeSpan(expirationTime.Value.Ticks);
                if (tsNow.TotalMilliseconds > tsExpire.TotalMilliseconds)
                {
                    Log.Error($"The token [{token}] has an expired time stamp!");
                    return null;
                }
            }
            
            return GetUserIdentification(token);
        }

        private string GetUserIdentification(string token )
        {
            ClaimsPrincipal principal = GetPrincipal(token);
            if (principal == null)
            {
                return null;
            }

            ClaimsIdentity identity = null;
            try
            {
                identity = (ClaimsIdentity) principal.Identity;
            }
            catch (NullReferenceException e)
            {
                Log.Error(e, $"Error - get user identification by token:[{token}]"); //todo check this
                return null;
            }

            Claim userIdentificationClaim = identity.FindFirst(ClaimTypes.Name);
            return userIdentificationClaim.Value;
        }

        public async Task<bool> UpdateToken(string token, Dictionary<string, object> parameters, DateTime expire)
        {
            #region ensure block
            Ensure.That(token).IsNotNullOrEmpty();
            #endregion ensure block

            ClaimsPrincipal principal = GetPrincipal(token);
            if (principal == null)
                return false;

            try
            {
                if (!_storageTokens.TryGetValue(token, out var oldParameters))
                {
                    Log.Warning($"Cant get token parameters for [{token}] ");
                    return false;
                }

                var newParameters = new Dictionary<string, object>();
                foreach (var item in oldParameters)
                {
                    if (item.Key == "expires")
                    {
                        newParameters.Add(item.Key, expire);
                        continue;
                    }
                   
                    if(parameters.ContainsKey(item.Key))
                        newParameters.Add(item.Key, parameters[item.Key]);
                }

                if (_storageTokens.TryUpdate(token, newParameters, oldParameters))
                {
                    await _dumpStorageContext.Update(_storageTokens);
                    return true;
                }
                else
                {
                    Log.Warning($"Cant update token parameters for [{token}] ");
                    return false;
                }
            }
            catch (Exception e)
            {
                Log.Error(e, $"Error update token:[{token}]");
                return false;
            }

        }

        public async Task<bool> RemoveToken(string token, string emailAddress)
        {
            if (!string.IsNullOrEmpty(token))
            {
                ClaimsPrincipal principal = GetPrincipal(token);
                if (principal == null)
                    return false;

                if (TryRemoveTokenBody(token))
                {
                    await _dumpStorageContext.Update(_storageTokens);
                    return true;
                }
                else
                {
                    Log.Warning($"Cant remove token parameters for [{token}] ");
                    return false;
                }
            }

            if (!string.IsNullOrEmpty(emailAddress))
            {
                foreach (var storageTokenItem in _storageTokens.Keys)
                {
                    string userIdentification = GetUserIdentification(storageTokenItem);
                    if(!string.IsNullOrEmpty(userIdentification) && userIdentification == emailAddress)
                        if (TryRemoveTokenBody(storageTokenItem))
                        {
                            await _dumpStorageContext.Update(_storageTokens);
                            return true;
                        }
                        else
                        {
                            Log.Warning($"Cant remove token parameters for [{storageTokenItem}] ");
                            return false;
                        }
                }
            }
            
            return false;
        }

        public async Task<Dictionary<string, object>> GetTokenParameters(string token, string emailAddress)
        {
            var parameters = new Dictionary<string, object>();

            if (!string.IsNullOrEmpty(token))
            {
                ClaimsPrincipal principal = GetPrincipal(token);
                if (principal == null)
                    return parameters;

                if (!_storageTokens.TryGetValue(token, out parameters))
                {
                        Log.Warning($"Cant get token parameters for [{token}] ");
                }
                return parameters;
            }

            if (!string.IsNullOrEmpty(emailAddress))
            {
                return parameters;
            }

            foreach (var storageTokenItem in _storageTokens.Keys)
            {
                string userIdentification = GetUserIdentification(storageTokenItem);
                if (string.IsNullOrEmpty(userIdentification) || userIdentification != emailAddress)
                    continue;

                if (!_storageTokens.TryGetValue(storageTokenItem, out parameters))
                {
                    Log.Warning($"Cant get token parameters for [{storageTokenItem}] ");
                }
                break;
            }

            return parameters;
        }

        private static bool TryRemoveTokenBody(string token)
        {
            try
            {
                return _storageTokens.TryRemove(token, out var parameters);
            }
            catch (Exception e)
            {
                Log.Error(e, $"Error remove token:[{token}]");
                return false;
            }
        }
    }
}
