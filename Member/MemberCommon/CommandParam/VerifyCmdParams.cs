using ApiGatewayCommon;

namespace MemberCommon.CommandParam
{
    public class VerifyCmdParams : ICommandParameters
    {
        public string emailAddress { get; set; }
        public string password { get; set; }
    }
}
