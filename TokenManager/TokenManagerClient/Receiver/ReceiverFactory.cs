using System.Collections.Generic;
using ApiGatewayCommon;

namespace TokenManagerClient.Receiver
{
    public class ReceiverFactory
    {

        private readonly Dictionary<int, IReceiverFlyweight<ICmdResult, ICommandParameters>> _receivers =
            new Dictionary<int, IReceiverFlyweight<ICmdResult, ICommandParameters>>();

        public ReceiverFactory(string tokenManagerServiceUrl)
        {
            _receivers.Add(ActionType.GenerateToken, new GenerateTokenReceiverFlyweight(tokenManagerServiceUrl));
            _receivers.Add(ActionType.ValidateToken, new ValidateTokenReceiverFlyweight(tokenManagerServiceUrl));
            _receivers.Add(ActionType.RemoveToken, new RemoveTokenReceiverFlyweight(tokenManagerServiceUrl));
            _receivers.Add(ActionType.UpdateToken, new UpdateTokenReceiverFlyweight(tokenManagerServiceUrl));
            _receivers.Add(ActionType.GetTokenParameters, new GetTokenParametersReceiverFlyweight(tokenManagerServiceUrl));
        }

        public IReceiverFlyweight<ICmdResult, ICommandParameters> GetReceiver(int actionType)
        {
            return _receivers[actionType];
        }
    }
}
