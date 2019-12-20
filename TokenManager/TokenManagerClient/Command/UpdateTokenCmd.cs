using System.Threading.Tasks;
using ApiGatewayCommon;

namespace TokenManagerClient.Command
{
    public class UpdateTokenCmd : ICommand<bool>
    {
        private readonly IReceiver<ICommandParameters, ICmdResult> _receiver;
        private readonly ICommandParameters _parameters;
        
        public UpdateTokenCmd(IReceiver<ICommandParameters, ICmdResult> receiver, ICommandParameters parameters)
        {
            _receiver = receiver;
            _parameters = parameters;
        }

        public async Task<bool> Execute()
        {
            var cmdResult = (CmdResult<bool>)await _receiver.Action(ActionType.UpdateToken, _parameters);
            return cmdResult.GetResult();
        }
    }
}
