using ApiGatewayCommon;

namespace MemberCommon.CommandParam
{
    public class VerifyEmplCmdParams : ICommandParameters
    {
        public string userId { get; set; }
        public string password { get; set; }
    }
}
