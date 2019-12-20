using System.Threading.Tasks;
using ApiGatewayCommon;
using MemberCommon.Enum;
using MemberCommon.Model;

namespace MemberClient.Command
{
    public class GetMemberInfoCmd : ICommand<MemberModel>
    {
        private readonly IReceiver<ICommandParameters, ICmdResult> _receiver;
        private readonly ICommandParameters _parameters;

        public GetMemberInfoCmd(IReceiver<ICommandParameters, ICmdResult> receiver, ICommandParameters parameters)
        {
            _receiver = receiver;
            _parameters = parameters;
        }

        public async Task<MemberModel> Execute()
        {
            var cmdResult = (CmdResult<MemberModel>) await _receiver.Action(ActionType.GetMemberInfo, _parameters);
            return cmdResult.GetResult();
        }
    }
}
