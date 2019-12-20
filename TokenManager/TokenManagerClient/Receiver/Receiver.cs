using System.Threading.Tasks;
using ApiGatewayCommon;

namespace TokenManagerClient.Receiver
{
    public class Receiver : IReceiver<ICommandParameters, ICmdResult>
    {
        private readonly ReceiverFactory _receiverFactory;

        public Receiver(string tokenManagerServiceUrl)
        {
            _receiverFactory = new ReceiverFactory(tokenManagerServiceUrl);
        }

        public async Task<ICmdResult> Action(int actionType, ICommandParameters parameters)
        {
            var receiver = _receiverFactory.GetReceiver(actionType);
            return await receiver.Action(parameters);
        }
    }
}
