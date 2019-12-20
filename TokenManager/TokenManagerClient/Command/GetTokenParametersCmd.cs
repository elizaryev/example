using System.Collections.Generic;
using System.Threading.Tasks;
using ApiGatewayCommon;

namespace TokenManagerClient.Command
{
    public class GetTokenParametersCmd : ICommand<Dictionary<string, object>>
    {
        private readonly IReceiver<ICommandParameters, ICmdResult> _receiver;
        private readonly ICommandParameters _parameters;

        public GetTokenParametersCmd(IReceiver<ICommandParameters, ICmdResult> receiver, ICommandParameters parameters)
        {
            _receiver = receiver;
            _parameters = parameters;
        }

        public async Task<Dictionary<string, object>> Execute()
        {
            var cmdResult = (CmdResult<Dictionary<string, object>>)await _receiver.Action(ActionType.GetTokenParameters, _parameters);
            return cmdResult.GetResult();
        }
    }
}
