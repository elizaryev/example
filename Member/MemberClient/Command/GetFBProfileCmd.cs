using System.Threading.Tasks;
using ApiGatewayCommon;
using MemberCommon.Enum;
using MemberCommon.Model;

namespace MemberClient.Command
{
    public class GetFBProfileCmd : ICommand<FacebookProfile>
    {
        private readonly IReceiver<ICommandParameters, ICmdResult> _receiver;
        private readonly ICommandParameters _parameters;

        public GetFBProfileCmd(IReceiver<ICommandParameters, ICmdResult> receiver, ICommandParameters parameters)
        {
            _receiver = receiver;
            _parameters = parameters;
        }

        public async Task<FacebookProfile> Execute()
        {
            var cmdResult = (CmdResult<FacebookProfile>)await _receiver.Action(ActionType.GetFBProfile, _parameters);
            return cmdResult.GetResult();
        }
    }
}
