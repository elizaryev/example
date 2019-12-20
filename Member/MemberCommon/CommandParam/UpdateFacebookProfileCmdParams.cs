using ApiGatewayCommon;
using MemberCommon.Model;

namespace MemberCommon.CommandParam
{
    public class UpdateFacebookProfileCmdParams : ICommandParameters
    {
        public int MemberKey { get; set; }
        public FacebookProfile profile { get; set; }
    }
}
