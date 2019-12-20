using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using ApiGatewayCommon;
using MemberCommon.CommandParam;
using MemberCommon.Model;
using Newtonsoft.Json;

namespace MemberClient.Receiver
{

    #region CreateMemberReceiverFlyweight
    public class CreateMemberReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _memberServiceUrl;

        public CreateMemberReceiverFlyweight(string memberServiceUrl)
        {
            _memberServiceUrl = memberServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject((CreateMemberCmdParams)parameters)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_memberServiceUrl}/create", content);
            }

            var result = await response.Content.ReadAsStringAsync();
            bool.TryParse(result, out var res);
            var cmdResult = new CmdResult<bool>(res);
            return cmdResult;
        }
    }
    #endregion CreateMemberReceiverFlyweight

    #region GetUserInfoReceiverFlyweight
    public class GetUserInfoReceiverFlyweight: IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _memberServiceUrl;

        public GetUserInfoReceiverFlyweight(string memberServiceUrl)
        {
            _memberServiceUrl = memberServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            var builder = new UriBuilder($"{_memberServiceUrl}");
            if (parameters != null && !string.IsNullOrEmpty(((GetMemberInfoCmdParams)parameters).EmailAddress))
            {
                builder.Query = $"emailAddress={((GetMemberInfoCmdParams)parameters).EmailAddress}";
            }
            if (parameters != null && ((GetMemberInfoCmdParams)parameters).Member != null )
            {
                builder.Query = $"member={((GetMemberInfoCmdParams)parameters).Member}";
            }

            using (HttpClient client = new HttpClient())
            {
                response = await client.GetAsync(builder.Uri);
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return new CmdResult<MemberModel>(new MemberModel());

            var cmdResult = new CmdResult<MemberModel>(JsonConvert.DeserializeObject<MemberModel>(result));
            return cmdResult;
        }
    }
    #endregion GetUserInfoReceiverFlyweight

    #region GetWdmMemberReceiverFlyweight
    public class GetWdmMemberReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _wdmMemberServiceUrl;

        public GetWdmMemberReceiverFlyweight(string wdmMemberServiceUrl)
        {
            _wdmMemberServiceUrl = wdmMemberServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            var builder = new UriBuilder($"{_wdmMemberServiceUrl}");
            if (parameters != null && ((GetWdmMemberInfoCmdParams)parameters).WdmMember != null)
            {
                builder.Query = $"wdmMember={((GetWdmMemberInfoCmdParams)parameters).WdmMember}";
            }
            if (parameters != null && ((GetWdmMemberInfoCmdParams)parameters).Member != null)
            {
                builder.Query = $"member={((GetWdmMemberInfoCmdParams)parameters).Member}";
            }

            using (HttpClient client = new HttpClient())
            {
                response = await client.GetAsync(builder.Uri);
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return null;

            var cmdResult = new CmdResult<WdmMemberModel>(JsonConvert.DeserializeObject<WdmMemberModel>(result));
            return cmdResult;
        }
    }
    #endregion GetWdmMemberReceiverFlyweight

    #region VerifyReceiverFlyweight
    public class VerifyReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _memberServiceUrl;

        public VerifyReceiverFlyweight(string memberServiceUrl)
        {
            _memberServiceUrl = memberServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject((VerifyCmdParams)parameters)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_memberServiceUrl}verify", content);
            }

            var result = await response.Content.ReadAsStringAsync();
            bool.TryParse(result, out var res);
            var cmdResult = new CmdResult<bool>(res);
            return cmdResult;
        }
    }
    #endregion VerifyReceiverFlyweight

    #region GetEmployeeInfoReceiverFlyweight
    public class GetEmployeeInfoReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _employeeServiceUrl;

        public GetEmployeeInfoReceiverFlyweight(string employeeServiceUrl)
        {
            _employeeServiceUrl = employeeServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            var builder = new UriBuilder($"{_employeeServiceUrl}");
            if (parameters != null && !string.IsNullOrEmpty(((GetEmplInfoCmdParams)parameters).UserId))
            {
                builder.Query = $"userId={((GetEmplInfoCmdParams)parameters).UserId}";
            }

            using (HttpClient client = new HttpClient())
            {
                response = await client.GetAsync(builder.Uri);
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return null;

            var cmdResult = new CmdResult<EmployeeModel>(JsonConvert.DeserializeObject<EmployeeModel>(result));
            return cmdResult;
        }
    }
    #endregion GetEmployeeInfoReceiverFlyweight

    #region VerifyEmplReceiverFlyweight
    public class VerifyEmplReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _employeeServiceUrl;

        public VerifyEmplReceiverFlyweight(string employeeServiceUrl)
        {
            _employeeServiceUrl = employeeServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject((VerifyEmplCmdParams)parameters)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_employeeServiceUrl}verify", content);
            }

            var result = await response.Content.ReadAsStringAsync();
            bool.TryParse(result, out var res);
            var cmdResult = new CmdResult<bool>(res);
            return cmdResult;
        }
    }
    #endregion VerifyEmplReceiverFlyweight

    #region UpdateWdmMemberReceiverFlyweight
    public class UpdateWdmMemberReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _wdmMemberServiceUrl;

        public UpdateWdmMemberReceiverFlyweight(string wdmMemberServiceUrl)
        {
            _wdmMemberServiceUrl = wdmMemberServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(
                    Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(((UpdateWdmMemberCmdParams) parameters).model)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_wdmMemberServiceUrl}", content);
            }

            var result = await response.Content.ReadAsStringAsync();
            bool.TryParse(result, out var res);
            var cmdResult = new CmdResult<bool>(res);
            return cmdResult;
        }
    }
    #endregion UpdateWdmMemberReceiverFlyweight

    #region GetFBProfileReceiverFlyweight
    public class GetFBProfileReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _memberServiceUrl;

        public GetFBProfileReceiverFlyweight(string memberServiceUrl)
        {
            _memberServiceUrl = memberServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject((GetFBProfileCmdParams)parameters)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_memberServiceUrl}facebook/profile", content);
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return null;

            var cmdResult = new CmdResult<FacebookProfile>(JsonConvert.DeserializeObject<FacebookProfile>(result));
            return cmdResult;
        }
    }
    #endregion GetFBProfileReceiverFlyweight

    #region GetUserInfoByFbIdReceiverFlyweight
    public class GetUserInfoByFbIdReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _memberServiceUrl;

        public GetUserInfoByFbIdReceiverFlyweight(string memberServiceUrl)
        {
            _memberServiceUrl = memberServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            var builder = new UriBuilder($"{_memberServiceUrl}facebook");
            if (parameters != null && !string.IsNullOrEmpty(((GetMemberInfoByFbIdCmdParams)parameters).FacebookId))
            {
                builder.Query = $"id={((GetMemberInfoByFbIdCmdParams)parameters).FacebookId}";
            }

            using (HttpClient client = new HttpClient())
            {
                response = await client.GetAsync(builder.Uri);
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return null;

            var cmdResult = new CmdResult<MemberModel>(JsonConvert.DeserializeObject<MemberModel>(result));
            return cmdResult;
        }
    }
    #endregion GetUserInfoByFbIdReceiverFlyweight

    #region UpdateFacebookReceiverFlyweight
    public class UpdateFacebookReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _memberServiceUrl;

        public UpdateFacebookReceiverFlyweight(string memberServiceUrl)
        {
            _memberServiceUrl = memberServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(
                    Encoding.UTF8.GetBytes(JsonConvert.SerializeObject((UpdateFacebookProfileCmdParams)parameters)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_memberServiceUrl}facebook/profile/update", content);
            }

            var result = await response.Content.ReadAsStringAsync();
            bool.TryParse(result, out var res);
            var cmdResult = new CmdResult<bool>(res);
            return cmdResult;
        }
    }
    #endregion UpdateFacebookReceiverFlyweight

    #region GetFBProfileEmailCmdReceiverFlyweight
    public class GetFBProfileEmailCmdReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _memberServiceUrl;

        public GetFBProfileEmailCmdReceiverFlyweight(string memberServiceUrl)
        {
            _memberServiceUrl = memberServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject((GetFBProfileEmailCmdParams)parameters)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_memberServiceUrl}facebook/profile/email", content);
            }

            string result = await response.Content.ReadAsStringAsync();
            var cmdResult = new CmdResult<string>(result);
            return cmdResult;
        }
    }
    #endregion GetFBProfileEmailCmdReceiverFlyweight

    #region UpdateGoogleProfileReceiverFlyweight
    public class UpdateGoogleProfileReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _memberServiceUrl;

        public UpdateGoogleProfileReceiverFlyweight(string memberServiceUrl)
        {
            _memberServiceUrl = memberServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(
                    Encoding.UTF8.GetBytes(JsonConvert.SerializeObject((UpdateGoogleProfileCmdParams)parameters)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_memberServiceUrl}google/profile/update", content);
            }

            var result = await response.Content.ReadAsStringAsync();
            bool.TryParse(result, out var res);
            var cmdResult = new CmdResult<bool>(res);
            return cmdResult;
        }
    }
    #endregion UpdateGoogleProfileReceiverFlyweight

    #region GetGoogleProfileReceiverFlyweight
    public class GetGoogleProfileReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _memberServiceUrl;

        public GetGoogleProfileReceiverFlyweight(string memberServiceUrl)
        {
            _memberServiceUrl = memberServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject((GetGoogleProfileCmdParams)parameters)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_memberServiceUrl}google/profile", content);
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return null;

            var cmdResult = new CmdResult<GoogleProfile>(JsonConvert.DeserializeObject<GoogleProfile>(result));
            return cmdResult;
        }
    }
    #endregion GetGoogleProfileReceiverFlyweight

    #region VerifyGoogleTokenReceiverFlyweight
    public class VerifyGoogleTokenReceiverFlyweight : IReceiverFlyweight<ICmdResult, ICommandParameters>
    {
        private readonly string _memberServiceUrl;

        public VerifyGoogleTokenReceiverFlyweight(string memberServiceUrl)
        {
            _memberServiceUrl = memberServiceUrl;
        }

        public async Task<ICmdResult> Action(ICommandParameters parameters)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject((VerifyGoogleTokenCmdParams)parameters)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_memberServiceUrl}google/verify", content);
            }

            var result = await response.Content.ReadAsStringAsync();
            bool.TryParse(result, out var res);
            var cmdResult = new CmdResult<bool>(res);
            return cmdResult;
        }
    }
    #endregion VerifyGoogleTokenReceiverFlyweight
}