using System.Threading.Tasks;
using ApiGatewayCommon;
using MemberCommon.Enum;
using MemberCommon.Model;

namespace MemberClient.Command
{
    public class GetEmplInfoCmd : ICommand<EmployeeModel>
    {
        private readonly IReceiver<ICommandParameters, ICmdResult> _receiver;
        private readonly ICommandParameters _parameters;

        public GetEmplInfoCmd(IReceiver<ICommandParameters, ICmdResult> receiver, ICommandParameters parameters)
        {
            _receiver = receiver;
            _parameters = parameters;
        }

        public async Task<EmployeeModel> Execute()
        {
            var cmdResult = (CmdResult<EmployeeModel>) await _receiver.Action(ActionType.GetEmplInfo, _parameters);
            return cmdResult.GetResult();
        }
    }
}
