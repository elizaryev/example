﻿using System.Threading.Tasks;
using ApiGatewayCommon;
using MemberCommon.Enum;

namespace MemberClient.Command
{
    public class UpdateFacebookProfileCmd : ICommand<bool>
    {
        private readonly IReceiver<ICommandParameters, ICmdResult> _receiver;
        private readonly ICommandParameters _parameters;

        public UpdateFacebookProfileCmd(IReceiver<ICommandParameters, ICmdResult> receiver, ICommandParameters parameters)
        {
            _receiver = receiver;
            _parameters = parameters;
        }

        public async Task<bool> Execute()
        {
            var cmdResult = (CmdResult<bool>)await _receiver.Action(ActionType.UpdateFacebookProfile, _parameters);
            return cmdResult.GetResult();
        }
    }
}
