using ApiGatewayCommon;

namespace MemberCommon.CommandParam
{
    public class GetFBProfileCmdParams : ICommandParameters
    {
        public string AccessToken { get; set; }
        public bool UseFakeEmail { get; set; }
    }
}
