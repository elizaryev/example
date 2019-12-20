using ApiGatewayCommon;

namespace TokenManagerCommon.CommandParam
{
    public class RemoveTokenCmdParams : ICommandParameters
    {
        public string Token { get; set; }
        public string EmailAddress { get; set; }
    }
}
