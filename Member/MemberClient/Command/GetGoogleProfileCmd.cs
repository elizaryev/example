using System.Threading.Tasks;
using ApiGatewayCommon;
using MemberCommon.Enum;

namespace MemberClient.Command
{
    public class GetGoogleProfileCmd : ICommand<GoogleProfile>
    {
        private readonly IReceiver<ICommandParameters, ICmdResult> _receiver;
        private readonly ICommandParameters _parameters;

        public GetGoogleProfileCmd(IReceiver<ICommandParameters, ICmdResult> receiver, ICommandParameters parameters)
        {
            _receiver = receiver;
            _parameters = parameters;
        }

        public async Task<GoogleProfile> Execute()
        {
            var cmdResult = (CmdResult<GoogleProfile>)await _receiver.Action(ActionType.GetGoogleProfile, _parameters);
            return cmdResult.GetResult();
        }
    }
}
