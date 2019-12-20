using ApiGatewayCommon;

namespace MemberCommon.CommandParam
{
    public class GetGoogleProfileCmdParams : ICommandParameters
    {
        public string Token { get; set; }
        public string OpenId { get; set; }
    }
}
