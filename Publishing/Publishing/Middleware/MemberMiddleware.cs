using System;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Gallery.Entities;
using MemberClient.Command;
using MemberCommon.CommandParam;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using Serilog;
using Serilog.Events;
using TokenManagerClient.Command;
using TokenManagerCommon.CommandParam;
using MemberReceiver = MemberClient.Receiver.Receiver;
using TokenReceiver = TokenManagerClient.Receiver.Receiver;

namespace Gallery.Middleware
{
    class MemberMiddleware
    {
        readonly RequestDelegate _next;
        const string MessageTemplate = "MEMBER Middleware exception";
        private readonly MemberReceiver _memberReceiver;
        private readonly TokenReceiver _tokenReceiver;

        public MemberMiddleware(RequestDelegate next, IMemberMiddlewareServiceSettings memberMiddlewareServiceSettings)
        {
            _next = next ?? throw new ArgumentNullException(nameof(next));

            _memberReceiver = new MemberReceiver(memberMiddlewareServiceSettings.MemberServiceSettingsValue.MemberServiceUrl,
                memberMiddlewareServiceSettings.MemberServiceSettingsValue.WdmMemberServiceUrl,
                memberMiddlewareServiceSettings.MemberServiceSettingsValue.EmployeeServiceUrl);

            _tokenReceiver = new TokenReceiver(memberMiddlewareServiceSettings.TokenManagerServiceSettingsValue.TokenManagerServiceUrl);
        }

        public async Task Invoke(HttpContext httpContext)
        {
            if (httpContext == null) throw new ArgumentNullException(nameof(httpContext));

            var sw = Stopwatch.StartNew();
            try
            {
                var statusCode = httpContext.Response?.StatusCode;
                var level = statusCode > 499 ? LogEventLevel.Error : LogEventLevel.Information;

                if (level != LogEventLevel.Error)
                {
                    MemberProcess(httpContext);
                }

                await _next(httpContext);
                sw.Stop();
            }
            // Never caught, because `LogException()` returns false.
            catch (Exception ex) when (LogException(httpContext, sw, ex)) { }
        }

        void MemberProcess(HttpContext httpContext)
        {
            var token = GetTokenValue(httpContext.Request, out var anonymous);
            // if anonymous not need get member info
            if (anonymous)
            {
                return;
            }

            // if before got member info and stored it
            if (httpContext.Items.Keys.Any(f => f.Equals(token)))
                return;

            var cmdParam = new ValidateTokenCmdParams() { Token = token };
            var cmd = new ValidateTokenCmd(_tokenReceiver, cmdParam);
            string tokenEmailAddress = cmd.Execute().Result;
            if (string.IsNullOrEmpty(tokenEmailAddress))
                return;

            // if token for anon user
            var getTokenCmdParam = new GetTokenParameters { Token = token };
            var getTokenCmd = new GetTokenParametersCmd(_tokenReceiver, getTokenCmdParam);
            var tokenParameters = getTokenCmd.Execute().Result;

            bool anonymousToken = false;
            if (tokenParameters.ContainsKey(TokenManagerCommon.Constants.AnonymousKeyName))
                if (!bool.TryParse(tokenParameters[TokenManagerCommon.Constants.AnonymousKeyName].ToString(), out anonymousToken))
                {
                    Log.Error(
                        $"MemberProcess: can't parse anonymous value:[{tokenParameters[TokenManagerCommon.Constants.AnonymousKeyName]}]!");
                    return;
                }
            if (anonymousToken)
                return;

            var cmdParamMbr = new GetMemberInfoCmdParams() { EmailAddress = tokenEmailAddress };
            var cmdMbr = new GetMemberInfoCmd(_memberReceiver, cmdParamMbr);
            var member = cmdMbr.Execute().Result;

            httpContext.Items.Add(token, member);
        }

        static StringValues GetTokenValue(HttpRequest request, out bool anonymous)
        {
            StringValues token;
            anonymous = false;
            bool hasTokenKey = request.Headers.ContainsKey("token");
            if (!hasTokenKey)
            {
                anonymous = true;
            }

            if (hasTokenKey)
            {
                token = request.Headers["token"];
                string tokenVal = token.ToString();
                anonymous = (tokenVal == "null" || tokenVal == "");
            }

            return token;
        }

        static bool LogException(HttpContext httpContext, Stopwatch sw, Exception ex)
        {
            sw.Stop();

            LogForErrorContext(httpContext)
                .Error(ex, MessageTemplate, httpContext.Request.Method, httpContext.Request.Path, 500, sw.Elapsed.TotalMilliseconds);

            return false;
        }

        static ILogger LogForErrorContext(HttpContext httpContext)
        {
            var request = httpContext.Request;

            var result = Log
                .ForContext("RequestHeaders", request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString()), destructureObjects: true)
                .ForContext("RequestHost", request.Host)
                .ForContext("RequestProtocol", request.Protocol);

            if (request.HasFormContentType)
                result = result.ForContext("RequestForm", request.Form.ToDictionary(v => v.Key, v => v.Value.ToString()));

            return result;
        }
    }
}
