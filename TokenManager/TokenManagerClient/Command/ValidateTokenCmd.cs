using System.Threading.Tasks;
using ApiGatewayCommon;

namespace TokenManagerClient.Command
{
    public class ValidateTokenCmd : ICommand<string>
    {
        private readonly IReceiver<ICommandParameters, ICmdResult> _receiver;
        private readonly ICommandParameters _parameters;

        public ValidateTokenCmd(IReceiver<ICommandParameters, ICmdResult> receiver, ICommandParameters parameters)
        {
            _receiver = receiver;
            _parameters = parameters;
        }

        public async Task<string> Execute()
        {
            var cmdResult = (CmdResult<string>)await _receiver.Action(ActionType.ValidateToken, _parameters);
            return cmdResult.GetResult();
        }
    }
}
