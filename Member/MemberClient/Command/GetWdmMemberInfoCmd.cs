using System.Threading.Tasks;
using ApiGatewayCommon;
using MemberCommon.Enum;
using MemberCommon.Model;

namespace MemberClient.Command
{
    public class GetWdmMemberInfoCmd : ICommand<WdmMemberModel>
    {
        private readonly IReceiver<ICommandParameters, ICmdResult> _receiver;
        private readonly ICommandParameters _parameters;

        public GetWdmMemberInfoCmd(IReceiver<ICommandParameters, ICmdResult> receiver, ICommandParameters parameters)
        {
            _receiver = receiver;
            _parameters = parameters;
        }

        public async Task<WdmMemberModel> Execute()
        {
            var cmdResult = (CmdResult<WdmMemberModel>)await _receiver.Action(ActionType.GetWdmMemberInfo, _parameters);
            return cmdResult.GetResult();
        }
    }
}
