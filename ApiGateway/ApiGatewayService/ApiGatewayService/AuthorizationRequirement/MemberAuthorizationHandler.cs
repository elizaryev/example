using System.Threading.Tasks;
using ApiGatewayService.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using TokenManagerClient.Receiver;

namespace ApiGatewayService.AuthorizationRequirement
{
    public class MemberAuthorizationHandler : AuthorizationHandler<MemberRequirement>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Receiver _receiver;

        public MemberAuthorizationHandler(IOptions<TokenManagerServiceSettings> tokenManagerServiceSettings,
            IHttpContextAccessor httpContextAccessor = null)
        {
            _httpContextAccessor = httpContextAccessor;
            _receiver = new Receiver(tokenManagerServiceSettings.Value.TokenManagerServiceUrl);
        }

        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context,
            MemberRequirement requirement)
        {
            if(requirement.IsMember(_httpContextAccessor, _receiver))
                context.Succeed(requirement);
            
            return Task.CompletedTask;
        }
    }
}
