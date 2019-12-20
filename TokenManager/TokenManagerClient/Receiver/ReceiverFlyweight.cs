using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using ApiGatewayCommon;
using Newtonsoft.Json;
using TokenManagerCommon.CommandParam;

namespace TokenManagerClient.Receiver
{
    #region GenerateTokenReceiverFlyweight
    public class GenerateTokenReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _tokenManagerServiceUrl;

        public GenerateTokenReceiverFlyweight(string tokenManagerServiceUrl)
        {
            _tokenManagerServiceUrl = tokenManagerServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject((GenerateTokenCmdParams)parameters)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_tokenManagerServiceUrl}generate", content);
            }

            string result = await response.Content.ReadAsStringAsync();
            //if (string.IsNullOrEmpty(result))
            //    return null;

            var cmdResult = new CmdResult<string>(result);
            return cmdResult;
        }
    }
    #endregion GenerateTokenReceiverFlyweight

    #region ValidateTokenReceiverFlyweight
    public class ValidateTokenReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _tokenManagerServiceUrl;

        public ValidateTokenReceiverFlyweight(string tokenManagerServiceUrl)
        {
            _tokenManagerServiceUrl = tokenManagerServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject((ValidateTokenCmdParams)parameters)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_tokenManagerServiceUrl}validate", content);
            }

            string result = await response.Content.ReadAsStringAsync();
            //if (string.IsNullOrEmpty(result))
            //    return null;

            var cmdResult = new CmdResult<string>(result);
            return cmdResult;
        }
    }
    #endregion ValidateTokenReceiverFlyweight

    #region RemoveTokenReceiverFlyweight
    public class RemoveTokenReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _tokenManagerServiceUrl;

        public RemoveTokenReceiverFlyweight(string tokenManagerServiceUrl)
        {
            _tokenManagerServiceUrl = tokenManagerServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
           using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject((RemoveTokenCmdParams)parameters)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_tokenManagerServiceUrl}remove", content);
            }

            var result = await response.Content.ReadAsStringAsync();
            bool.TryParse(result, out var res);
            var cmdResult = new CmdResult<bool>(res);
            return cmdResult;
        }
    }
    #endregion RemoveTokenReceiverFlyweight

    #region UpdateTokenReceiverFlyweight
    public class UpdateTokenReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _tokenManagerServiceUrl;

        public UpdateTokenReceiverFlyweight(string tokenManagerServiceUrl)
        {
            _tokenManagerServiceUrl = tokenManagerServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject((UpdateTokenCmdParams)parameters)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_tokenManagerServiceUrl}", content);
            }

            string result = await response.Content.ReadAsStringAsync();
            bool.TryParse(result, out var res);
            var cmdResult = new CmdResult<bool>(res);
            return cmdResult;
        }
    }
    #endregion UpdateTokenReceiverFlyweight

    #region GetTokenParametersReceiverFlyweight
    public class GetTokenParametersReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _tokenManagerServiceUrl;

        public GetTokenParametersReceiverFlyweight(string tokenManagerServiceUrl)
        {
            _tokenManagerServiceUrl = tokenManagerServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject((GetTokenParameters)parameters)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_tokenManagerServiceUrl}getparameters", content);
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return new CmdResult<Dictionary<string, object>>(new Dictionary<string, object>());

            var cmdResult = new CmdResult<Dictionary<string, object>>(JsonConvert.DeserializeObject<Dictionary<string, object>>(result));
            return cmdResult;
        }
    }
    #endregion GetTokenParametersReceiverFlyweight
}
