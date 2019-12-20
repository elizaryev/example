using System.Threading.Tasks;

namespace TokenManagerClient.Receiver
{
    public interface IReceiverFlyweight<TResult, in TCommandParameters>
    {
        Task<TResult> Action(TCommandParameters parameters);
    }
}
