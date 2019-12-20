using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ApiGatewayCommon;
using ApiGatewayService.Entities;
using ApiGatewayService.Misc;
using ApiGatewayService.Model;
using MemberCommon.Model;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Serilog;
using TokenManagerClient.Command;
using TokenManagerClient.Receiver;
using TokenManagerCommon;
using TokenManagerCommon.CommandParam;
using Utils;

namespace ApiGatewayService.BusinessLogic
{
    public class GatewayService: IGatewayService
    {
        private readonly Receiver _receiver;
        private readonly string _serverPath;
        private readonly IMemberService _memberService;
        private readonly int _YPMinDefaultMinutesSessionTimeout;

        public GatewayService(IOptions<TokenManagerServiceSettings> tokenManagerServiceSettings, 
            IOptions<AuthenticationSettings> authenticationSettings,
            IMemberService memberService)
        {
            _receiver = new Receiver(tokenManagerServiceSettings.Value.TokenManagerServiceUrl);
            _serverPath = authenticationSettings.Value.LCPSessionNetworkServerPath;
            _memberService = memberService;

            if (!int.TryParse(tokenManagerServiceSettings.Value.YPMinDefaultMinutesSessionTimeout,
                    out _YPMinDefaultMinutesSessionTimeout) || _YPMinDefaultMinutesSessionTimeout == 0)
            {
                _YPMinDefaultMinutesSessionTimeout = 40; // by default set 40 minutes if some error when parse config value
            }
        }

        #region facebook

        public MemberModel InitFacebookNewMember(FacebookProfile profile)
        {
            var newMember = new MemberModel
            {
                EmailAddr = profile.Email,
                MemberId = profile.Email,
                MemberNickName = profile.Name,
                FirstName = Utils.Helper.Helper.GetFullNameValue(profile.FirstName, profile.LastName),
                LastName = profile.LastName
            };

            return newMember;
        }

        public async Task<Result> SignUpByFacebookAccessToken(string token, string accessToken)
        {
            var fbProfile = await _memberService.GetFacebookProfile(accessToken);
            if (fbProfile == null)
            {
                return new Result(204, $"The fb account profile info for access token:[{accessToken}] not found.");
            }

            MemberModel member;
            string resultCreatedMember;
            if (!string.IsNullOrEmpty(fbProfile.Email))
            {
                string memberEmail = await GetEmailByToken(token);
                if (fbProfile.Email == memberEmail)
                    return new Result(0);

                member = await _memberService.GetMemberInfo(fbProfile.Email);
                if (!string.IsNullOrEmpty(member.MemberId))
                    return new Result(0);

                resultCreatedMember = await CreateNewMemberForFacebookAccount(fbProfile);
                if (!string.IsNullOrEmpty(resultCreatedMember))
                {
                    return new Result(500, resultCreatedMember);
                }
                return new Result(0);
            }

            // if fb profile registered by phone
            member = await _memberService.GetMemberInfoByFacebookId(fbProfile.Id);
            // if member already exists.
            if (!string.IsNullOrEmpty(member.MemberId))
                return new Result(0);

            resultCreatedMember = await CreateNewMemberForFacebookAccount(fbProfile);
            if (!string.IsNullOrEmpty(resultCreatedMember))
            {
                return new Result(500, resultCreatedMember);
            }
            return new Result(0);
        }

        private async Task<string> CreateNewMemberForFacebookAccount(FacebookProfile fbProfile)
        {
            var newMember = InitFacebookNewMember(fbProfile);
            var created = await _memberService.CreateMember(newMember);
            if (created)
            {
                var member = await _memberService.GetMemberInfo(fbProfile.Email);
                var updatedFbProfile = await _memberService.UpdateFacebookProfile(member.MemberKey, fbProfile);
                if (!updatedFbProfile)
                {
                    Log.Warning($"Unable to update Facebook profile for new member:[{member.MemberKey}]");
                }
            }

            return created 
                ? string.Empty
                : $"Unable to create new member for Facebook account:[{fbProfile.Email}]";
        }

        #endregion facebook

        #region google

        public async Task<Result> LoginByGoogleAccessToken(string accessToken, string openId, LoginParameters loginParameters, Dictionary<string, object> loginDict)
        {
            var googleProfile = await _memberService.GetGoogleProfile(accessToken, openId);
            //Can't get the email address from Google API
            if (googleProfile == null)
            {
                return new Result(204, $"The google account profile info for access token:[{accessToken}] not found.");
            }

            MemberModel member = await _memberService.GetMemberInfo(googleProfile.Email);
            // if member already exists. Just update Facebook columns
            if (!string.IsNullOrEmpty(member.MemberId))
            {
                var updatedFbProfile = await _memberService.UpdateGoogleProfile(member.MemberKey, googleProfile);
                if (!updatedFbProfile)
                {
                    Log.Warning($"Unable to update Facebook profile for member:[{member.MemberKey}]");
                }
            }
            else
            {
                var resultCreatedMember = await CreateNewMemberForGoogleAccount(googleProfile);
                if (!string.IsNullOrEmpty(resultCreatedMember))
                {
                    return new Result(500, resultCreatedMember);
                }
            }

            var expire = loginParameters.RememberMe
                ? DateTime.Now.AddYears(100) // emulation of the 1st century to the timestamp of the expiration
                : DateTime.Now.AddMinutes(loginParameters.YPSessionTimeout == 0
                    ? _YPMinDefaultMinutesSessionTimeout
                    : loginParameters.YPSessionTimeout); // usage YP timeout

            var token = await GenerateToken(googleProfile.Email, loginDict, expire); 

            // SignIn to the YP site too
            if (!string.IsNullOrEmpty(loginParameters.CartOrderId))
            {
                bool loggedToYP = await LoginOnYPSite(loginParameters, member);
                if (!loggedToYP)
                {
                    Log.Warning($"Unable to login in the YP site for new member:[{member.MemberKey}]");
                }
            }

            return new Result(token);
        }

        private MemberModel InitGoogleNewMember(GoogleProfile profile)
        {
            var newMember = new MemberModel
            {
                EmailAddr = profile.Email,
                MemberId = profile.Email,
                MemberNickName = profile.Name,
                FirstName = Utils.Helper.Helper.GetFullNameValue(profile.GivenName, profile.FamilyName),
                LastName = !string.IsNullOrEmpty(profile.FamilyName) ? profile.FamilyName : string.Empty
            };

            return newMember;
        }

        private async Task<string> CreateNewMemberForGoogleAccount(GoogleProfile profile)
        {
            var newMember = InitGoogleNewMember(profile);
            var created = await _memberService.CreateMember(newMember);
            if (created)
            {
                var member = await _memberService.GetMemberInfo(profile.Email);
                var updatedFbProfile = await _memberService.UpdateGoogleProfile(member.MemberKey, profile);
                if (!updatedFbProfile)
                {
                    Log.Warning($"Unable to update Google profile for new member:[{member.MemberKey}]");
                }
            }

            return created
                ? string.Empty
                : $"Unable to create new member for Google account:[{profile.Email}]";
        }

        #endregion google

        #region token
        public async Task<string> GenerateToken(string emailAddress, Dictionary<string, object> parameters, DateTime? expire)
        {
            var cmdParam = new GenerateTokenCmdParams() { EmailAddress = emailAddress, Parameters = parameters, Expire = expire};
            var cmd = new GenerateTokenCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return result;
        }

        public async Task<bool> RemoveToken(string token, LoginParameters parameters)
        {
            var cmdParam = new RemoveTokenCmdParams() { Token = token };
            var cmd = new RemoveTokenCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            if (Convert.ToBoolean((object) result))
            {
                if (!string.IsNullOrEmpty(parameters.CartOrderId))
                {
                    var lcpSessionCtl = new LCPSessionCtl(parameters.CartOrderId, _serverPath, parameters.YPUICulture,
                        !parameters.RememberMe, parameters.YPSessionTimeout);

                    return Helper.LogOutReset(lcpSessionCtl);
                }

                return true;
            }

            return false;
        }

        public async Task<bool> IsAnonymousUser(string token)
        {
            var getTokenCmdParam = new GetTokenParameters { Token = token };
            var getTokenCmd = new GetTokenParametersCmd(_receiver, getTokenCmdParam);
            var tokenParameters = await getTokenCmd.Execute();

            if (!tokenParameters.ContainsKey(Constants.AnonymousKeyName))
                return false;

            if (!bool.TryParse(tokenParameters[Constants.AnonymousKeyName].ToString(), out var anonymous))
            {
                Log.Error($"IsAnonymousUser: can't parse anonymous value:[{tokenParameters[Constants.AnonymousKeyName]}]!");
                return false;
            }

            return anonymous;
        }

        public async Task<bool> RemoveTokenByEmailAddress(string emailAddress)
        {
            var cmdParam = new RemoveTokenCmdParams() { EmailAddress = emailAddress };
            var cmd = new RemoveTokenCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return Convert.ToBoolean((object)result);
        }

        public async Task<bool> ValidateToken(string token)
        {
            var cmdParam = new ValidateTokenCmdParams() { Token = token };
            var cmd = new ValidateTokenCmd(_receiver, cmdParam);
            string tokenUsername = await cmd.Execute();
            if (string.IsNullOrEmpty(tokenUsername))
            {
                return false;
            }
            return true;
        }

        public async Task<string> GetEmailByToken(string token)
        {
            var cmdParam = new ValidateTokenCmdParams() { Token = token };
            var cmd = new ValidateTokenCmd(_receiver, cmdParam);
            string tokenUsername = await cmd.Execute();
            return tokenUsername;
        }

        #endregion token

        public async Task<MemberModel> GetMemberInfoByLoginParameters(LoginParameters parameters)
        {
            // Member and session info is always stored under UniqId session xml file, not under UniqId-TabUniqId session xml file
            var lcpSessionCtl = new LCPSessionCtl(GetUniqIdByCartOrderId(parameters.CartOrderId), _serverPath, parameters.YPUICulture,
                !parameters.RememberMe, parameters.YPSessionTimeout);
            int.TryParse(lcpSessionCtl.GetAVar("_Mbr"), out int memberId);
            if (memberId > 0)
            {
                var user = await _memberService.GetMemberInfoByMember(memberId);
                return user;
            }

            return null;
        }

        public async Task<bool> LoginOnYPSite(LoginParameters parameters, MemberModel member)
        {
            try
            {
                // Member and session info is always stored under UniqId session xml file, not under UniqId-TabUniqId session xml file
                var lcpSessionCtl = new LCPSessionCtl(GetUniqIdByCartOrderId(parameters.CartOrderId), _serverPath, parameters.YPUICulture,
                !parameters.RememberMe, parameters.YPSessionTimeout);

                EmployeeLogOut(lcpSessionCtl);

                // workaround to fix "Uniq_Id" field when it is empty
                if (member.UniqId.Trim() == "")
                {
                    member.UniqId = "MBR" + member.MemberKey.ToString("D9");
                }

                lcpSessionCtl.SetAVar("Member_Logged_In_Flag", "Yes", false);
                lcpSessionCtl.SetAVar("Member_PKey", member.MemberKey.ToString(), false);
                lcpSessionCtl.SetAVar("Member_Uniq_Id", member.UniqId, false);
                lcpSessionCtl.SetAVar("Agency_Member_Flag", member.AgencyMemberFlg, false);
                lcpSessionCtl.SetAVar("Pro_Member_Flag", member.ProMemberFlg, false);

                if (member.MemberNickName.Length > 0)
                {
                    lcpSessionCtl.SetAVar("Member_Nick_Name", member.MemberNickName, false);
                }
                else
                {
                    lcpSessionCtl.SetAVar("Member_Nick_Name", $"{member.FirstName} {member.LastName}", false);
                }

                lcpSessionCtl.SetAVar("_Mbr", member.MemberKey.ToString(), false);
                lcpSessionCtl.SetAVar("Employee_Member_Flg", member.EmployeeMemberFlg, true);
                lcpSessionCtl.SetAVar("MyFolderCurrentPath", "", false);
                lcpSessionCtl.SetAVar("MyFolderActionDepth", "", false);
                lcpSessionCtl.SetAVar("MyFolderReturnURL", "", true);

                // todo: ignore - mb in future
                // _memberUniqId is the same as cartOrderId
                //if (!string.IsNullOrEmpty(member.UniqId))
                //{
                //    var orderHelper = new OrderHelper();
                //    var dtblCart = orderHelper.InquireStgOrderDtlProd(member.UniqId);
                //    lcpSessionCtl.SetAVar("My_Cart_Item_Count", dtblCart.Rows.Count.ToString(), true);
                //}

                lcpSessionCtl.SyncCommitAllVars();

                // todo: ignore - mb in a future
                //var promoTrackHelper = new PromoTrackHelper(_request, _response, _uniqId);
                //promoTrackHelper.HandlePromoTracking(PromoTrackStep.Login, member);

                // todo: ignore set remember and sideID cookies values
                //AfterLogin(_request, _response, rememberMe);

                return true;
            }
            catch (Exception e)
            {
                // todo: check it any times
                Log.Error(e, string.Empty);
                return false;
            }
        }

        public async Task<Dictionary<string, object>> GetTokenParameters(string token, string emailAddress)
        {
            var cmdParam = new GetTokenParameters() { Token = token, EmailAddress = emailAddress};
            var cmd = new GetTokenParametersCmd(_receiver, cmdParam);
            var tokenParameters = await cmd.Execute();
            return tokenParameters;
        }


        private void EmployeeLogOut(LCPSessionCtl lcpSessionCtl)
        {
            lcpSessionCtl.SetAVar("Employee_Logged_In_Flag", "No", false);
            lcpSessionCtl.SetAVar("Employee_Name", "", false);
            lcpSessionCtl.SetAVar("Employee_PKey", "", false);
            lcpSessionCtl.SetAVar("Employee_User_Id", "", false);
            lcpSessionCtl.SetAVar("Employee_Can_Do_Admin", "", false);
            lcpSessionCtl.SetAVar("Employee_Can_Do_Order", "", false);
            lcpSessionCtl.SetAVar("Employee_Can_Do_Service", "", false);
            lcpSessionCtl.SetAVar("Employee_Can_Do_Payment", "", false);
            lcpSessionCtl.SetAVar("Employee_Can_Do_Shipment", "", false);
            lcpSessionCtl.SetAVar("Employee_User_Lvl", "", true);
        }

        /// <summary>
        /// CartOrderId may contain TabUniqId as a part of its value like UniqId-TabUniqId
        /// This function drops a TabUniqId out. Useful for getting member info
        /// </summary>
        /// <param name="cartOrderId"></param>
        /// <returns></returns>
        private string GetUniqIdByCartOrderId(string cartOrderId)
        {
            if (cartOrderId.IndexOf("-") > 0)
                return cartOrderId.Substring(0, cartOrderId.IndexOf("-"));

            return cartOrderId;
        }

        public async Task<string>  GetTokenByLoginParameters(JObject data, int YPMinDefaultMinutesSessionTimeout)
        {
            var loginParameters = Helper.GetLoginParameters(data);
            var expire = loginParameters.RememberMe
                ? DateTime.Now.AddYears(100) // emulation of the 1st century to the timestamp of the expiration
                : DateTime.Now.AddMinutes(loginParameters.YPSessionTimeout == 0
                    ? YPMinDefaultMinutesSessionTimeout
                    : loginParameters.YPSessionTimeout); // usage YP timeout
            var loginDict = Helper.GetLoginDict(data);

            var member = await GetMemberInfoByLoginParameters(loginParameters);
            var token = "";
            if (member != null)
            {
                token = await GenerateToken(member.EmailAddr, loginDict, expire);
            }
            else
            {
                //add anonymous variant
                var anonymousName = $"{Guid.NewGuid().ToString()}-{Constants.AnonymousKeyName}";
                var userIdentification = anonymousName;
                // mark token as anonymous
                loginDict.Add(Constants.AnonymousKeyName, true);
                token = await GenerateToken(userIdentification, loginDict, expire);
            }

            return token;
        }
    }
}
