using ApiGatewayCommon;

namespace MemberCommon.CommandParam
{
    public class GetEmplInfoCmdParams : ICommandParameters
    {
        public string UserId { get; set; }
    }
}
