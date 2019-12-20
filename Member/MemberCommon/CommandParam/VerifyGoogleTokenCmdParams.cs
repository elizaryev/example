using ApiGatewayCommon;

namespace MemberCommon.CommandParam
{
    public class VerifyGoogleTokenCmdParams : ICommandParameters
    {
        public string Token{ get; set; }
        public string OpenId { get; set; }
    }
}
