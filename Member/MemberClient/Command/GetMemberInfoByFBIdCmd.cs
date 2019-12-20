using System.Threading.Tasks;
using ApiGatewayCommon;
using MemberCommon.Enum;
using MemberCommon.Model;

namespace MemberClient.Command
{
    public class GetMemberInfoByFBIdCmd : ICommand<MemberModel>
    {
        private readonly IReceiver<ICommandParameters, ICmdResult> _receiver;
        private readonly ICommandParameters _parameters;

        public GetMemberInfoByFBIdCmd(IReceiver<ICommandParameters, ICmdResult> receiver, ICommandParameters parameters)
        {
            _receiver = receiver;
            _parameters = parameters;
        }

        public async Task<MemberModel> Execute()
        {
            var cmdResult = (CmdResult<MemberModel>)await _receiver.Action(ActionType.GetMemberInfoByFbId, _parameters);
            return cmdResult.GetResult();
        }
    }
}
