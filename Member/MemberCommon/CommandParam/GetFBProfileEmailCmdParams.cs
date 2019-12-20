using ApiGatewayCommon;

namespace MemberCommon.CommandParam
{
    public class GetFBProfileEmailCmdParams : ICommandParameters
    {
        public string FacebookEmail { get; set; }
        public string MemberEmail { get; set; }
    }
}
