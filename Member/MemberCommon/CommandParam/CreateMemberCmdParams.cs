using ApiGatewayCommon;
using MemberCommon.Model;

namespace MemberCommon.CommandParam
{
    public class CreateMemberCmdParams : ICommandParameters
    {
        public MemberModel member { get; set; }
    }
}
