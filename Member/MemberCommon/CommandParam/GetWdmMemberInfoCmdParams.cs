using ApiGatewayCommon;

namespace MemberCommon.CommandParam
{
    public class GetWdmMemberInfoCmdParams : ICommandParameters
    {
        public int? WdmMember { get; set; }
        public int? Member { get; set; }
    }
}
