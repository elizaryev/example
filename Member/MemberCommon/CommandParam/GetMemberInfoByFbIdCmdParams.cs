using ApiGatewayCommon;

namespace MemberCommon.CommandParam
{
    public class GetMemberInfoByFbIdCmdParams : ICommandParameters
    {
        public string FacebookId { get; set; }
    }
}
