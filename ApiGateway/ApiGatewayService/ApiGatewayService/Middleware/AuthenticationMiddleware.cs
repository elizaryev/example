using System;
using System.Linq;
using System.Threading.Tasks;
using ApiGatewayService.Entities;
using EnsureThat;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Serilog;
using TokenManagerClient.Command;
using TokenManagerClient.Receiver;
using TokenManagerCommon.CommandParam;

namespace ApiGatewayService.Middleware
{
    public class AuthenticationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly Receiver _receiver;

        public AuthenticationMiddleware(RequestDelegate next, IOptions<TokenManagerServiceSettings> tokenManagerServiceSettings)
        {
            _next = next;
            _receiver = new Receiver(tokenManagerServiceSettings.Value.TokenManagerServiceUrl);
        }

        public async Task Invoke(HttpContext context, IOptions<AuthenticationSettings> authenticationSettings)
        {
            try
            {
                // Pass all requests in Dev environment
                bool isHeaderValid = !authenticationSettings.Value.Enabled || ValidateCredentials(context);
                if (isHeaderValid)
                {
                    await _next.Invoke(context);
                    return;
                }

                //Reject request if there is no authorization header or if it is not valid
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Unauthorized");
            }
            catch (Exception ex) when (LogException(context, ex))
            {
            }
        }

        static bool LogException(HttpContext context, Exception ex)
        {
            LogForErrorContext(context).Error(ex, "Authentication exception");
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

        private bool ValidateCredentials(HttpContext context)
        {
            var token = context.Request.Headers["token"];
            Ensure.That(token.ToString()).IsNotNullOrEmpty();

            var cmdParam = new ValidateTokenCmdParams() { Token = token };
            var cmd = new ValidateTokenCmd(_receiver, cmdParam);
            string tokenUsername = cmd.Execute().Result;
            if (string.IsNullOrEmpty(tokenUsername))
            {
                Log.Error("Wrong token");
                return false;
            }
            return true;
        }
    }


    public static class AuthenticationMiddlewareExtension
    {
        public static IApplicationBuilder UseAuthentication(this IApplicationBuilder app)
        {
            if (app == null)
            {
                throw new ArgumentNullException(nameof(app));
            }

            return app.UseMiddleware<AuthenticationMiddleware>();
        }
    }

    public class AuthenticationPipeline
    {
        public void Configure(IApplicationBuilder applicationBuilder)
        {
            applicationBuilder.UseAuthentication();
        }
    }
}
