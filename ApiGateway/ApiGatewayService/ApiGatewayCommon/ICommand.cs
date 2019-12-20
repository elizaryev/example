using System.Threading.Tasks;

namespace ApiGatewayCommon
{
    public interface ICommand<TResult>
    {
        Task<TResult> Execute();
    }
}
