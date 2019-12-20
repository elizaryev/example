using System;
using System.Collections.Generic;
using ApiGatewayCommon;

namespace TokenManagerCommon.CommandParam
{
    public class UpdateTokenCmdParams : ICommandParameters
    {
        public string Token { get; set; }
        public DateTime Expire { get; set; }
        public Dictionary<string, object> Parameters { get; set; }
    }
}
