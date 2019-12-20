using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ApiGatewayCommon;
using ApiGatewayService.Model;
using MemberCommon.Model;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace ApiGatewayService.BusinessLogic
{
    public interface IGatewayService
    {
        Task<string> GenerateToken(string emailAddress, Dictionary<string, object> parameters, DateTime? expire);
        Task<bool> RemoveToken(string token, LoginParameters parameters);
        Task<bool> RemoveTokenByEmailAddress(string emailAddress);
        Task<bool> ValidateToken(string token);
        Task<string> GetEmailByToken(string token);
        Task<MemberModel> GetMemberInfoByLoginParameters(LoginParameters parameters);
        Task<bool> LoginOnYPSite(LoginParameters parameters, MemberModel member);
        MemberModel InitFacebookNewMember(FacebookProfile profile);
        Task<Result> SignUpByFacebookAccessToken(string token, string accessToken);
        Task<Result> LoginByGoogleAccessToken(string accessToken, string openId, LoginParameters loginParameters, Dictionary<string, object> loginDict);
        Task<Dictionary<string, object>> GetTokenParameters(string token, string emailAddress);
        Task<bool> IsAnonymousUser(string token);
        Task<string> GetTokenByLoginParameters(JObject data, int YPMinDefaultMinutesSessionTimeout);
    }
}
