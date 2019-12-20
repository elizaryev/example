using System.Threading.Tasks;

namespace ApiGatewayCommon
{
    public interface IReceiver<in TCommandParameters, TResult>
    {
        Task<TResult> Action(int actionType, TCommandParameters parameters);
    }
}