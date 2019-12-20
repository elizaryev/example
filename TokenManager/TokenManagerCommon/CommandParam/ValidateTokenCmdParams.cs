using ApiGatewayCommon;

namespace TokenManagerCommon.CommandParam
{
    public class ValidateTokenCmdParams : ICommandParameters
    {
        public string Token { get; set; }
    }
}
