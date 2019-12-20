using ApiGatewayCommon;

namespace TokenManagerCommon.CommandParam
{
    public class GetTokenParameters : ICommandParameters
    {
        public string Token { get; set; }
        public string EmailAddress { get; set; }
    }
}
