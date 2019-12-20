using System.Threading.Tasks;
using ApiGatewayCommon;

namespace MemberClient.Receiver
{
    public class Receiver : IReceiver<ICommandParameters, ICmdResult>
    {
        private readonly ReceiverFactory _receiverFactory;

        public Receiver(string memberServiceUrl, string wdmMemberServiceUrl, string employeeServiceUrl)
        {
            _receiverFactory = new ReceiverFactory(memberServiceUrl, wdmMemberServiceUrl, employeeServiceUrl);
        }

        public async Task<ICmdResult> Action(int actionType, ICommandParameters parameters)
        {
            var receiver = _receiverFactory.GetReceiver(actionType);
            return await receiver.Action(parameters);
        }
    }
}
