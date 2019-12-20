using ApiGatewayCommon;

namespace MemberCommon.CommandParam
{
    public class GetMemberInfoCmdParams : ICommandParameters
    {
        public string EmailAddress { get; set; }
        public int? Member { get; set; }
    }
}
