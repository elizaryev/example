namespace ApiGatewayCommon
{
    public class CmdResult<T>: ICmdResult
    {
        private readonly T _result;

        public CmdResult(T result)
        {
            _result = result;
        }

        public T GetResult()
        {
            return _result;
        }
    } 
}