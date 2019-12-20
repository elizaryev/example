namespace ApiGatewayCommon
{
    public class Result
    {
        public int Code { get; set; }
        public string Message { get; set; }
        public object Value { get; set; }

        public Result()
        {
        }
        

        public Result(int code)
        {
            Code = code;
        }

        public Result(int code, string message)
        {
            Code = code;
            Message = message;
        }

        public Result(object value)
        {
            Code = 0;
            Value = value;
        }

        public Result(int code, string message, object value)
        {
            Code = code;
            Message = message;
            Value = value;
        }
    }
}
