using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using PublishingCommon.Model;

namespace PublishingClient
{
    public class PublishingService: IPublishingService
    {
        private readonly string _publishingServiceUrl;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PublishingService(string publishingServiceUrl, IHttpContextAccessor httpContextAccessor = null)
        {
            _publishingServiceUrl = publishingServiceUrl;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<int> SavePublishing(WdmItemModel publishingData, bool allImmediately = false)
        {
            ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new { publishingData, allImmediately })));
            byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            var content = (HttpContent)byteArrayContent;

            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri($"{_publishingServiceUrl}/save"),
                Method = HttpMethod.Post,
                Content = content
            };
            request.Headers.Add("token", _httpContextAccessor.HttpContext.Request.Headers["token"].ToString());

            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                response = await client.SendAsync(request);
            }

            var result = await response.Content.ReadAsStringAsync();
            int.TryParse(result, out var res);
            return res;
        }

        public async Task<bool> Remove(int wdmItem)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                response = await client.DeleteAsync($"{_publishingServiceUrl}{wdmItem}");
            }

            var result = await response.Content.ReadAsStringAsync();
            bool.TryParse(result, out var res);
            return res;
        }

        public async Task<List<WdmItemModel>> GetPublishedList(string publishStatusType, JObject requestData)
        {
            ByteArrayContent byteArrayContent =
                new ByteArrayContent(Encoding.UTF8.GetBytes(requestData.ToString()));
            byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            var content = (HttpContent)byteArrayContent;

            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri($"{_publishingServiceUrl}/item/list/{publishStatusType}"),
                Method = HttpMethod.Post,
                Content = content
            };
            request.Headers.Add("token", _httpContextAccessor.HttpContext.Request.Headers["token"].ToString());

            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                response = await client.SendAsync(request);
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return null;

            return JsonConvert.DeserializeObject<List<WdmItemModel>>(result);
        }

        public async Task<List<WdmItemModel>> GetUnpublishedList(JObject data)
        {
            ByteArrayContent byteArrayContent =
                new ByteArrayContent(Encoding.UTF8.GetBytes(data.ToString()));
            byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            var content = (HttpContent)byteArrayContent;

            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri($"{_publishingServiceUrl}/item/list/unpublish"),
                Method = HttpMethod.Post,
                Content = content
            };
            request.Headers.Add("token", _httpContextAccessor.HttpContext.Request.Headers["token"].ToString());

            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                client.Timeout = new TimeSpan(0, 2, 0);
                response = await client.SendAsync(request);
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return null;

            return JsonConvert.DeserializeObject<List<WdmItemModel>>(result);
        }

        public async Task<WdmItemModel> GetPublished(int wdmItem)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                response = await client.GetAsync($"{_publishingServiceUrl}item/{wdmItem}");
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return null;

            return JsonConvert.DeserializeObject<WdmItemModel>(result);
        }

        public async Task<WdmItemModel> GetPublishedByHash(string hash)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                response = await client.GetAsync($"{_publishingServiceUrl}item/hash/{hash}");
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return null;

            return JsonConvert.DeserializeObject<WdmItemModel>(result);
        }

        public async Task<List<WdmItemLogModel>> GetPublishProcessingLogs(int wdmItem)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                response = await client.GetAsync($"{_publishingServiceUrl}log/{wdmItem}");
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return null;

            return JsonConvert.DeserializeObject<List<WdmItemLogModel>>(result);
        }

        public async Task<bool> Update(WdmItemModel wdmItem, WdmItemLogModel log)
        {
            ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(new { wdmItem, log })));
            byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            var content = (HttpContent)byteArrayContent;

            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri($"{_publishingServiceUrl}/update"),
                Method = HttpMethod.Post,
                Content = content
            };
            request.Headers.Add("token", _httpContextAccessor.HttpContext.Request.Headers["token"].ToString());

            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                response = await client.SendAsync(request);
            }

            var result = await response.Content.ReadAsStringAsync();
            bool.TryParse(result, out var res);
            return res;
        }

        public async Task<(bool result, string errMsg)> UpdateWdmItem(WdmItemModel model)
        {
            ByteArrayContent byteArrayContent =
                new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(model)));
            byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            var content = (HttpContent)byteArrayContent;

            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri($"{_publishingServiceUrl}/item/update"),
                Method = HttpMethod.Post,
                Content = content
            };
            request.Headers.Add("token", _httpContextAccessor.HttpContext.Request.Headers["token"].ToString());

            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                response = await client.SendAsync(request);
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return (false, "Error.GalleryItemOperation.Rename.ErrorRename");

           return JsonConvert.DeserializeObject<(bool result, string errMsg)>(result);
        }
    }
}
