using ApiGatewayCommon;
using MemberCommon.Model;

namespace MemberCommon.CommandParam
{
    public class UpdateWdmMemberCmdParams : ICommandParameters
    {
        public WdmMemberModel model { get; set; }
    }
}
