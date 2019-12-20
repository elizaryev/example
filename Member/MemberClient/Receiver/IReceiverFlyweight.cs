using System.Threading.Tasks;

namespace MemberClient.Receiver
{
    public interface IReceiverFlyweight<TResult, in TCommandParameters>
    {
        Task<TResult> Action(TCommandParameters parameters);
    }
}