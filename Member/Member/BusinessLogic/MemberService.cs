using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Apache.Ignite.Core;
using Apache.Ignite.Core.Cache.Configuration;
using Apache.Ignite.Core.Deployment;
using Apache.Ignite.Core.Discovery.Tcp;
using Apache.Ignite.Core.Discovery.Tcp.Static;
using Apache.Ignite.Core.Events;
using AutoMapper;
using EnsureThat;
using Member.Entities;
using Member.Misc;
using Member.Repository;
using Member.Repository.Context;
using Member.Repository.DTO;
using MemberCommon.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using PublishingClient;
using PublishingCommon;
using Serilog;
using Utils.Helper;

namespace Member.BusinessLogic
{
    public class MemberService: IMemberService
    {
        private readonly MemberServiceSettings _memberServiceSettings;
        private readonly MemberContext _memberContext;
        private readonly IMapper _mapper;
        private readonly ISecurePasswordHasher _securePasswordHasher;
        private readonly IRatingService _ratingService;
        private readonly FacebookSettings _facebookSettings;
        private readonly GoogleSettings _goggleSettings;

        /// <summary>
        /// default value for lib limit in mb
        /// </summary>
        private const int LibLimitInMb = 1000;

        /// <summary>
        /// default value for MultiPage_Lib_Initial_Limit_In_MB
        /// </summary>
        private const int MultiPageLibInitialLimitInMb = 2000;

        /// <summary>
        /// default value for Private_Lib_Initial_Limit_In_MB
        /// </summary>
        private const int PrivateLibInitialLimitInMb = 1000;

        public MemberService(IOptions<MemberServiceSettings> memberServiceSettings,
            IOptions<FacebookSettings> facebookSettings,
            IOptions<GoogleSettings> goggleSettings,
            MemberContext memberContext,
            IMapper mapper,
            ISecurePasswordHasher securePasswordHasher,
            IRatingService ratingService
            )
        {
            _memberServiceSettings = memberServiceSettings.Value;
            _memberContext = memberContext;
            _mapper = mapper;
            _securePasswordHasher = securePasswordHasher;
            _ratingService = ratingService;
            _facebookSettings = facebookSettings.Value;
            _goggleSettings = goggleSettings.Value;
        }

        public async Task<bool> UpdateCacheMemberbyKey(int memberKey)
        {

            var member = await _memberContext.Member.FirstOrDefaultAsync(w => w.MemberKey == memberKey);

            var keysUpdating = new List<string>();
            keysUpdating.Add($"{Constants.CacheKeyName.MemberKey}{memberKey}");
            keysUpdating.Add($"{Constants.CacheKeyName.MemberEmail}{member.EmailAddr}");
            keysUpdating.Add($"{Constants.CacheKeyName.MemberId}{member.MemberId}");
            keysUpdating.Add($"{Constants.CacheKeyName.MemberFbId}{member.FbId}");

            if (!await CachedRepository.UpdateAll(keysUpdating, member))
            {
                Serilog.Log.Logger.Warning($"UpdateGoogleProfile: Not all keys were successfully updated!");
                return false;
            }

            return true;
        }

        public async Task<bool> CreateMember(MemberModel member)
        {
            #region ensure block
            Ensure.That(member).IsNotNull();
            #endregion ensure block

            string cacheKey = $"{Constants.CacheKeyName.MemberEmail}{member.EmailAddr}";
            var savedMemberDTO = await _memberContext.Member.CachedFirstOrDefaultAsync(f => f.EmailAddr == member.EmailAddr, cacheKey);
            if (savedMemberDTO != null)
            {
                return false;
            }

            member.AnonymousFlg = "No";
            member.MemberType = "Elite";
            member.MemberClass = "Regular";
            member.Country = int.Parse(_memberServiceSettings.AppCountryPrimaryKey);
            member.CountryName = _memberServiceSettings.AppCountryName;
            member.MemberStatus = "Active";
            member.DateStatus = DateTime.Now;
            member.LoginCount = 1;
            member.DateMember = DateTime.Now;
            member.DateLastAccess = DateTime.Now;
            member.MemberId = member.EmailAddr; // to save a temp value

            // if not FB or Google signUp action then must generating a hash pswd
            if (!string.IsNullOrEmpty(member.MemberPswd))
            {
                member.HashedPswd = _securePasswordHasher.Hash(member.MemberPswd);
                member.MemberPswd = string.Empty;
            }
            
            InitializeLimits(member);
            
            var savingMember = _mapper.Map<Repository.DTO.Member>(member);
            var newMember = await _memberContext.Member.AddAsync(savingMember);
            int changesSaved = await _memberContext.SaveChangesAsync();
            // update the Uniq_Id field of this Member (after primary Key is set)
            bool saved = (newMember.Entity.MemberKey >= 0 && changesSaved > 0);
            if (!saved) return false;
            
            SetUniqIdMember(newMember.Entity);
            SetMemberId(newMember.Entity);
            await SetMemberAgencyInfo(newMember.Entity);

            _memberContext.Member.Update(newMember.Entity);
            var updated = await _memberContext.SaveChangesAsync();
            if (updated <= 0)
            {
                Log.Warning($"Not saved uniqId and memberId values for member:[{newMember.Entity.MemberKey}]");
            }

            await CreateWdmMember(newMember.Entity.MemberKey);

            return true;
        }

        private async Task<WdmMember> CreateWdmMember(int memberKey)
        {
            var wdmMember = new WdmMember
            {
                Member = memberKey,
                ActiveFlg = "True"
            };
            var createWdmMember = await _memberContext.WdmMember.AddAsync(wdmMember);
            try
            {
                int wdmMemberSaved = await _memberContext.SaveChangesAsync();
                if (wdmMemberSaved <= 0)
                {
                    Log.Warning($"Not saved wdm member values for member id:[{memberKey}]");
                }
            }
            catch (Exception e)
            {
                Log.Error(e, $"Error when attempting to save a wdmMember for member id:[{memberKey}]");
            }

            return createWdmMember.Entity;
        }

        public async Task<bool> SetMemberAgencyInfo(Repository.DTO.Member savedMember)
        {
            if (savedMember.AgencyMemberFlg != "Yes") return false;

            savedMember.DateAgencyMember = DateTime.Now;
            if (savedMember.ReferByMemberId.Length <= 0)
            {
                savedMember.AgencyBranchLevel = 1;
                return false;
            }

            string cacheKey = $"{Constants.CacheKeyName.MemberId}{savedMember.ReferByMemberId}";
            var referMember = await _memberContext.Member.CachedFirstOrDefaultAsync(f => f.MemberId == savedMember.ReferByMemberId, cacheKey);
            if (referMember != null)
            {
                savedMember.ParentAgencyMember = referMember.MemberKey;
                savedMember.AgencyBranchLevel = referMember.AgencyBranchLevel + 1;
            }

            return true;
        }

        private void SetMemberId(Repository.DTO.Member savedMember)
        {
            string firstInit = "", lastInit = "";
            if (!string.IsNullOrEmpty(savedMember.FirstName) && savedMember.FirstName.Length > 0)
            { firstInit = savedMember.FirstName.Substring(0, 1).ToUpper(); }
            else
            { firstInit = "Y"; }
            if (!string.IsNullOrEmpty(savedMember.LastName) && savedMember.LastName.Length > 0)
            { lastInit = savedMember.LastName.Substring(0, 1).ToUpper(); }
            else
            { lastInit = "Z"; }
            if (firstInit.CompareTo("A") < 0 || firstInit.CompareTo("Z") > 0)
            { firstInit = "Y"; }
            if (lastInit.CompareTo("A") < 0 || lastInit.CompareTo("Z") > 0)
            { lastInit = "Z"; }
            //
            savedMember.MemberId = $"{savedMember.MemberKey.ToString()}{firstInit}{lastInit}";
        }

        private static void SetUniqIdMember(Repository.DTO.Member newMember)
        {
            string uniqId = "MBR";
            for (int i = newMember.MemberKey.ToString().Length; i < 9; i++)
            {
                uniqId += "0";
            }

            uniqId += newMember.MemberKey.ToString();
            newMember.UniqId = uniqId;
        }

        /// <summary>
        /// Initializes library disk space limits if necessary
        /// </summary>
        private void InitializeLimits(MemberModel member)
        {
            var result = _memberContext.CtlParams
                .FirstOrDefault(f => f.CtlParamId == "Member_LCP_Lib_Initial_Limit_In_MB");
            if (result == null)
            {
                member.LcpLibLimitInMb = LibLimitInMb;
            }
            else
            {
                int.TryParse(result.ParamValue, out var libLimitInMb);
                member.LcpLibLimitInMb = libLimitInMb <= 0 ? LibLimitInMb : libLimitInMb;
            }

            ////
            result = _memberContext.CtlParams
                .FirstOrDefault(f => f.CtlParamId == "Member_MultiPage_Lib_Initial_Limit_In_MB");
            if (result == null)
            {
                member.MultiPageLibLimitInMb = MultiPageLibInitialLimitInMb;
            }
            else
            {
                int.TryParse(result.ParamValue, out var multiPageLibInitialLimitInMb);
                member.MultiPageLibLimitInMb = multiPageLibInitialLimitInMb <= 0 ? MultiPageLibInitialLimitInMb : multiPageLibInitialLimitInMb;
            }

            ////
            result = _memberContext.CtlParams
                .FirstOrDefault(f => f.CtlParamId == "Member_Private_Lib_Initial_Limit_In_MB");
            if (result == null)
            {
                member.PrivateLibLimitInMb = PrivateLibInitialLimitInMb;
            }
            else
            {
                int.TryParse(result.ParamValue, out var privateLibInitialLimitInMb);
                member.PrivateLibLimitInMb = privateLibInitialLimitInMb <= 0 ? PrivateLibInitialLimitInMb : privateLibInitialLimitInMb;
            }
        }

        #region get member info

        public async Task<MemberModel> GetMemberInfo(string emailAddress)
        {
            #region ensure block
            Ensure.That(emailAddress).IsNotNullOrEmpty();
            #endregion ensure block
            string cacheKey = $"{Constants.CacheKeyName.MemberEmail}{emailAddress}";
            var memberDTO = await _memberContext.Member.CachedFirstOrDefaultAsync(f => f.EmailAddr == emailAddress, cacheKey);
            if (memberDTO == null)
                return new MemberModel();
            return _mapper.Map<MemberModel>(memberDTO);
        }

        public async Task<MemberModel> GetMemberInfoByFacebookId(string id)
        {
            #region ensure block
            Ensure.That(id).IsNotNullOrEmpty();
            #endregion ensure block

            string cacheKey = $"{Constants.CacheKeyName.MemberFbId}{id}";
            var memberDTO = await _memberContext.Member.CachedFirstOrDefaultAsync(f => f.FbId == id, cacheKey);
            if (memberDTO == null)
                return new MemberModel();
            return _mapper.Map<MemberModel>(memberDTO);
        }

        public async Task<MemberModel> GetMemberInfo(int? member)
        {
            Stopwatch stopWatch = new Stopwatch();
            stopWatch.Start();

            #region ensure block
            Ensure.That(member).IsNotNull();
            #endregion ensure block

            string cacheKey = $"{Constants.CacheKeyName.MemberKey}{member}";
            var memberDTO = await _memberContext.Member.CachedFirstOrDefaultAsync(f => f.MemberKey == member, cacheKey);
            if (memberDTO == null)
                return new MemberModel();
            return _mapper.Map<MemberModel>(memberDTO);
        }

        public async Task<WdmMemberModel> GetWdmMemberInfo(int? wdmMember)
        {
            #region ensure block
            Ensure.That(wdmMember).IsNotNull();
            #endregion ensure block

            string cacheKey = $"{Constants.CacheKeyName.WdmMemberKey}{wdmMember}";
            var wdmMemberDTO = await _memberContext.WdmMember.CachedFirstOrDefaultAsync(f => f.WdmMemberKey == wdmMember, cacheKey);
            if (wdmMemberDTO == null)
                return new WdmMemberModel();
            return _mapper.Map<WdmMemberModel>(wdmMemberDTO);
        }

        #endregion get member info

        public async Task<WdmMemberModel> GetWdmMemberInfoByMember(int? member)
        {
            #region ensure block
            Ensure.That(member).IsNotNull();
            #endregion ensure block

            string cacheKey = $"{Constants.CacheKeyName.WdmMember}{member}";
            var wdmMemberDTO = await _memberContext.WdmMember.CachedFirstOrDefaultAsync(f => f.Member == member, cacheKey);
            if (wdmMemberDTO == null)
            {
                var wdmMember = await CreateWdmMember(member.Value);
                var createdWdmMember = _mapper.Map<WdmMemberModel>(wdmMember);
                return createdWdmMember;
            }
            return _mapper.Map<WdmMemberModel>(wdmMemberDTO);
        }

        public async Task<bool> VerifyPass(string emailAddress, string password)
        {
            #region ensure block
            Ensure.That(emailAddress).IsNotNullOrEmpty();
            Ensure.That(password).IsNotNullOrEmpty();
            #endregion ensure block

            string cacheKey = $"{Constants.CacheKeyName.MemberEmail}{emailAddress}";
            var memberDTO = await _memberContext.Member.CachedFirstOrDefaultAsync(f => f.EmailAddr == emailAddress, cacheKey);
            if (memberDTO == null)
                return false;
            bool credentials = _securePasswordHasher.Verify(password, memberDTO.HashedPswd);
            return credentials;
        }

        public async Task<bool> UpdateFacebookProfile(int memberKey, FacebookProfile facebookProfile)
        {
            #region ensure block
            Ensure.Any.IsNotNull<FacebookProfile>(facebookProfile);
            #endregion ensure block

            string cacheKey = $"{Constants.CacheKeyName.MemberKey}{memberKey}";
            var member = await _memberContext.Member.CachedFirstOrDefaultAsync(f => f.MemberKey == memberKey, cacheKey);
            if (member == null)
            {
                return false;
            }

            member.FbFirstLoginAt = DateTime.Now;
            member.FbId = facebookProfile.Id;
            member.FbLocale = (string.IsNullOrEmpty(facebookProfile.Locale))
                ? member.FbLocale ?? string.Empty
                : facebookProfile.Locale;
            member.FbTimezone = facebookProfile.Timezone.ToString();
            member.FbName = facebookProfile.Name;
            member.FbFirstName = facebookProfile.FirstName;
            member.FbLastName = facebookProfile.LastName;
            member.FbGender = (string.IsNullOrEmpty(facebookProfile.Gender))
                ? member.FbGender ?? string.Empty
                : facebookProfile.Gender;
            member.FbPictureIsSilhouetteFlg = facebookProfile.Picture.Data.IsSilhouette ? "Yes" : "No";
            member.FbPictureUrl = facebookProfile.Picture.Data.Url.AbsoluteUri;
            member.FbLink = facebookProfile.Link == null
                ? member.FbLink ?? string.Empty
                : facebookProfile.Link.AbsoluteUri;
            member.FbVerifiedFlg = facebookProfile.Verified ? "Yes" : "No";
            member.FbShortName = facebookProfile.ShortName;
            member.FbNameFormat = facebookProfile.NameFormat;

            _memberContext.Member.Update(member);
            var saved = await _memberContext.SaveChangesAsync() > 0;
            if (saved)
            {
                var keysUpdating = new List<string>();
                keysUpdating.Add(cacheKey);
                keysUpdating.Add($"{Constants.CacheKeyName.MemberEmail}{member.EmailAddr}");
                keysUpdating.Add($"{Constants.CacheKeyName.MemberId}{member.MemberId}");
                keysUpdating.Add($"{Constants.CacheKeyName.MemberFbId}{member.FbId}");

                if (!await CachedRepository.UpdateAll(keysUpdating, member))
                {
                    Serilog.Log.Logger.Warning($"UpdateFacebookProfile: Not all keys were successfully updated!");
                }
            }

            return saved;
        }

        public async Task<bool> UpdateWdmMember(WdmMemberModel model)
        {
            #region ensure block
            Ensure.Any.IsNotNull<WdmMemberModel>(model);
            #endregion ensure block

            string cacheKey = $"{Constants.CacheKeyName.WdmMemberKey}{model.WdmMemberKey}";
            var wdmMember = await _memberContext.WdmMember.CachedFirstOrDefaultAsync(f => f.WdmMemberKey == model.WdmMemberKey, cacheKey);
            if (wdmMember == null)
            {
                return false;
            }

            var now = DateTime.Now;
            wdmMember.Tstamp = Helper.ConvertToTimestamp(now);
            // calc a rating values
            var ratingList = await _ratingService.GetRatingList(model.Member.ToString());
            wdmMember.CountRating = ratingList.Count();
            List<short?> list = new List<short?>();
            foreach (var ratingItem in ratingList) list.Add(ratingItem.Rating);
            wdmMember.MemberRating = Calculation.RatingValue(list);

            _memberContext.WdmMember.Update(wdmMember);
            var saved = await _memberContext.SaveChangesAsync() > 0;
            if (saved)
            {
                var keysUpdating = new List<string>();
                keysUpdating.Add(cacheKey);
                keysUpdating.Add($"{Constants.CacheKeyName.WdmMember}{wdmMember.Member}");

                if (!await CachedRepository.UpdateAll(keysUpdating, wdmMember))
                {
                    Serilog.Log.Logger.Warning($"UpdateWdmMember: Not all keys were successfully updated!");
                }
            }
            return saved;
        }
        
        #region employee

        public async Task<bool> VerifyEmployeePass(string userId, string password)
        {
            #region ensure block
            Ensure.That(userId).IsNotNullOrEmpty();
            Ensure.That(password).IsNotNullOrEmpty();
            #endregion ensure block

            string cacheKey = $"employee-userId-{userId}";
            var employee = await _memberContext.Employee.CachedFirstOrDefaultAsync(f => f.UserId == userId, cacheKey);
            if (employee == null)
                return false;
            bool credentials = _securePasswordHasher.Verify(password, employee.HashedPswd);
            return credentials;
        }

        public async Task<EmployeeModel> GetEmployeeInfo(string userId)
        {
            #region ensure block
            Ensure.That(userId).IsNotNullOrEmpty();
            #endregion ensure block

            string cacheKey = $"employee-userId-{userId}";
            var employee = await _memberContext.Employee.CachedFirstOrDefaultAsync(f => f.UserId == userId, cacheKey);
            if (employee == null)
                return new EmployeeModel();
            return _mapper.Map<EmployeeModel>(employee);
        }

        #endregion employee

        #region Facebook

        public string GetFBProfileEmail(string facebookEmail, string memberEmail)
        {
            //#region ensure block
            //Ensure.That(facebookEmail).IsNotNullOrEmpty();
            //Ensure.That(memberEmail).IsNotNullOrEmpty();
            //#endregion ensure block

            // if facebook profile have not fake email,
            // then facebook profile not use phone for registration and we get this email
            return !facebookEmail.Contains(_facebookSettings.FakeEmailAddress)
                ? facebookEmail
                : memberEmail;
        }

        private string GenerateAppSecretProof(string accessToken)
        {
            #region ensure block
            Ensure.That(accessToken).IsNotNullOrEmpty();
            #endregion ensure block

            var accessTokenBytes = Encoding.UTF8.GetBytes(accessToken);
            var appSecretBytes = Encoding.UTF8.GetBytes(_facebookSettings.AppSecret);
            var hashstring = new HMACSHA256(appSecretBytes);
            var hash = hashstring.ComputeHash(accessTokenBytes);
            string hashString = string.Empty;
            foreach (byte x in hash)
            {
                hashString += String.Format("{0:x2}", x);
            }
            return hashString;
        }

        public async Task<FacebookProfile> GetFacebookProfile(string accessToken, bool useFakeEmail)
        {
            #region ensure block
            Ensure.That(accessToken).IsNotNullOrEmpty();
            #endregion ensure block

            if (! await CheckFbAccessToken(accessToken))
                return null;

            var parameters = $"access_token={accessToken}&appsecret_proof={GenerateAppSecretProof(accessToken)}&fields={_facebookSettings.Fields}";
            try
            {
                using (WebClient webClient = new WebClient())
                {
                    webClient.Encoding = System.Text.Encoding.UTF8;
                    webClient.Headers[HttpRequestHeader.ContentType] = "form-data";
                    string response = await webClient.UploadStringTaskAsync($"{_facebookSettings.UrlGraph}me", parameters);
                    var facebookProfile = JsonConvert.DeserializeObject<FacebookProfile>(response);

                    // if account usage phone instead email
                    if (useFakeEmail && string.IsNullOrEmpty(facebookProfile.Email))
                        facebookProfile.Email = string.Format("{0}{1}", facebookProfile.Id, _facebookSettings.FakeEmailAddress);
                    
                    return facebookProfile;
                }
            }
            catch (Exception ex)
            {
                Log.Error($"GetFacebookProfile ex.Message:[{ex.Message}], ex.StackTrace:[{ ex.StackTrace}], parameters:[{parameters}]");
                return null;
            }
        }

        private async Task<bool> CheckFbAccessToken(string accessToken)
        {
            try
            {
                var responseDefinition = new { success = false };

                var parameters = $"access_token={accessToken}&appsecret_proof={GenerateAppSecretProof(accessToken)}";
                using (WebClient webClient = new WebClient())
                {
                    webClient.Encoding = System.Text.Encoding.UTF8;
                    webClient.Headers[HttpRequestHeader.ContentType] = "form-data";
                    string response = await webClient.UploadStringTaskAsync($"{_facebookSettings.UrlGraph}me", parameters);
                    var responseObject = JsonConvert.DeserializeAnonymousType(response, responseDefinition);
                    return responseObject.success;
                }
            }
            catch (Exception ex)
            {
                Log.Error($"CheckFacebookAccessToken ex.Message:[{ex.Message}], ex.StackTrace:[{ ex.StackTrace}]");
                return false;
            }
        }

        #endregion

        #region google

        public async Task<bool> UpdateGoogleProfile(int memberKey, GoogleProfile googleProfile)
        {
            #region ensure block
            Ensure.Any.IsNotNull<GoogleProfile>(googleProfile);
            #endregion ensure block

            string cacheKey = $"{Constants.CacheKeyName.MemberKey}{memberKey}";
            var member = await _memberContext.Member.CachedFirstOrDefaultAsync(f => f.MemberKey == memberKey, cacheKey);
            if (member == null)
            {
                return false;
            }

            member.GoogleEmailVerifiedFlg = googleProfile.EmailVerified ? "Yes" : "No";
            member.GoogleName = googleProfile.Name;
            member.GooglePictureUrl = googleProfile.Picture.AbsoluteUri;
            member.GoogleGivenName = googleProfile.GivenName;
            member.GoogleFamilyName = string.IsNullOrEmpty(googleProfile.FamilyName) 
                ? string.Empty 
                : googleProfile.FamilyName;
            member.GoogleLocale = googleProfile.Locale;
            member.GoogleOpenId = googleProfile.OpenId;

            _memberContext.Member.Update(member);
            var saved = await _memberContext.SaveChangesAsync() > 0;
            if (saved)
            {
                var keysUpdating = new List<string>();
                keysUpdating.Add(cacheKey);
                keysUpdating.Add($"{Constants.CacheKeyName.MemberEmail}{member.EmailAddr}");
                keysUpdating.Add($"{Constants.CacheKeyName.MemberId}{member.MemberId}");
                keysUpdating.Add($"{Constants.CacheKeyName.MemberFbId}{member.FbId}");

                if (!await CachedRepository.UpdateAll(keysUpdating, member))
                {
                    Serilog.Log.Logger.Warning($"UpdateGoogleProfile: Not all keys were successfully updated!");
                }
            }
              
            return saved;
        }

        public async Task<bool> VerifyGoogleToken(string token, string openId)
        {
            #region ensure block
            Ensure.That(token).IsNotNullOrEmpty();
            Ensure.That(openId).IsNotNullOrEmpty();
            #endregion ensure block

            var profile = await FetchGoggleProfile(token, openId);
            if (profile == null || profile.Aud != _goggleSettings.ClientID)
            {
                return false;
            }
            return true;
        }


        public async Task<GoogleProfile> GetGoogleProfile(string token, string openId)
        {
            #region ensure block
            Ensure.That(token).IsNotNullOrEmpty();
            Ensure.That(openId).IsNotNullOrEmpty();
            #endregion ensure block

            bool isTokenValid = await VerifyGoogleToken(token, openId);
            if (!isTokenValid)
            {
                return null;
            }

            var profile =  await FetchGoggleProfile(token, openId);
            if (profile == null || profile.Aud != _goggleSettings.ClientID)
            {
                return null;
            }
            return profile;
        }

        private async Task<GoogleProfile> FetchGoggleProfile(string token, string openId)
        {
            var url =  $"{_goggleSettings.ApiBaseUrl}tokeninfo?id_token={token}";
            try
            {
                using (WebClient webClient = new WebClient())
                {
                    webClient.Encoding = System.Text.Encoding.UTF8;
                    webClient.Headers[HttpRequestHeader.ContentType] = "form-data";
                    string response = await webClient.DownloadStringTaskAsync(url);
                    var profile = JsonConvert.DeserializeObject<GoogleProfile>(response);
                    profile.OpenId = !string.IsNullOrEmpty(profile.OpenId) ? profile.OpenId : openId;
                    return profile;
                }
            }
            catch (Exception ex)
            {
                //If the token is invalid Google API will respond with a 400 Bad request resulting in an Exception with this very old WebClient class...
                Log.Error($"FetchGoggleProfile ex.Message:[{ex.Message}], ex.StackTrace:[{ ex.StackTrace}]");
                return null;
            }
        }

        #endregion google
    }
}
