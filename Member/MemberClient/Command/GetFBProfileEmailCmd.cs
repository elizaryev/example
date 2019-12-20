using System.Threading.Tasks;
using ApiGatewayCommon;
using MemberCommon.Enum;

namespace MemberClient.Command
{
    public class GetFBProfileEmailCmd : ICommand<string>
    {
        private readonly IReceiver<ICommandParameters, ICmdResult> _receiver;
        private readonly ICommandParameters _parameters;

        public GetFBProfileEmailCmd(IReceiver<ICommandParameters, ICmdResult> receiver, ICommandParameters parameters)
        {
            _receiver = receiver;
            _parameters = parameters;
        }

        public async Task<string> Execute()
        {
            var cmdResult = (CmdResult<string>)await _receiver.Action(ActionType.GetFBProfileEmail, _parameters);
            return cmdResult.GetResult();
        }
    }
}
