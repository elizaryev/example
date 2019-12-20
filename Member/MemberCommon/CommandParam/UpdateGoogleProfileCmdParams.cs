using ApiGatewayCommon;

namespace MemberCommon.CommandParam
{
    public class UpdateGoogleProfileCmdParams : ICommandParameters
    {
        public int MemberKey { get; set; }
        public GoogleProfile Profile { get; set; }
    }
}
