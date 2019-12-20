using System.Threading.Tasks;
using ApiGatewayService.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Serilog;
using TokenManagerClient.Command;
using TokenManagerClient.Receiver;
using TokenManagerCommon.CommandParam;
using TokenManagerCommon;

namespace ApiGatewayService.AuthorizationRequirement
{
    public class MemberRequirement : IAuthorizationRequirement
    {
        public bool IsMember(IHttpContextAccessor httpContextAccessor, Receiver receiver)
        {
            if (httpContextAccessor == null || receiver == null)
            {
                Log.Error("IsMember: don't have http context!");
                return false;
            }

            var token = httpContextAccessor.HttpContext.Request.Headers["token"].ToString();

            var cmdParam = new ValidateTokenCmdParams() { Token = token };
            var cmd = new ValidateTokenCmd(receiver, cmdParam);
            string tokenUsername = cmd.Execute().Result;
            if (string.IsNullOrEmpty(tokenUsername))
            {
                Log.Error("IsMember: token don't have username!");
                return false;
            }

            var getTokenCmdParam = new GetTokenParameters { Token = token };
            var getTokenCmd = new GetTokenParametersCmd(receiver, getTokenCmdParam);
            var tokenParameters = getTokenCmd.Execute().Result;

            if (!tokenParameters.ContainsKey(Constants.AnonymousKeyName))
                return true;

            if (!bool.TryParse(tokenParameters[Constants.AnonymousKeyName].ToString(), out var anonymous))
            {
                Log.Error(
                    $"IsMember: can't parse anonymous value:[{tokenParameters[Constants.AnonymousKeyName].ToString()}]!");
                return false;
            }

            return !anonymous;
        }
    }
}
