using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using DesignCommon.Model;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using PublishingCommon.Model;
using PublishingCommon.RequestModel;

namespace PublishingClient
{
    public class OrderService: IOrderService
    {
        private readonly string _orderServiceUrl;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public OrderService(string orderServiceUrl, IHttpContextAccessor httpContextAccessor = null)
        {
            _orderServiceUrl = orderServiceUrl;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<int> GetCountStgOrderDtl()
        {
            HttpResponseMessage response;
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri($"{_orderServiceUrl}/stage/detail/count"),
                Method = HttpMethod.Get
            };
            request.Headers.Add("token", _httpContextAccessor.HttpContext.Request.Headers["token"].ToString());

            using (HttpClient client = new HttpClient())
            {
                response = await client.SendAsync(request);
            }

            string result = await response.Content.ReadAsStringAsync();
            int.TryParse(result, out var res);
            return res;
        }

        public async Task<(DesignSpecModel designSpecModel, int price, int optnPrice,
            Dictionary<string, string> additionalParamsDesignSpec)> GetMyCartItemDataByDesignHash(string designHash)
        {
            HttpResponseMessage response;
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri($"{_orderServiceUrl}/mycart/item/{designHash}"),
                Method = HttpMethod.Get
            };

            using (HttpClient client = new HttpClient())
            {
                client.Timeout = new TimeSpan(0, 3, 0);
                response = await client.SendAsync(request);
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return (null, 0, 0, null);

            return JsonConvert.DeserializeObject<(DesignSpecModel designSpecModel, int price, int optnPrice,
                Dictionary<string, string> additionalParamsDesignSpec)>(result);
        }

        public async Task<(bool result, string error, string originalType)> ProcessMyCartData(CreatingMyCartRequest requestData)
        {
            ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(requestData)));
            byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            var content = (HttpContent)byteArrayContent;

            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri($"{_orderServiceUrl}/mycart/create"),
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

            var result = await response.Content.ReadAsStringAsync();

            if (string.IsNullOrEmpty(result))
                return (false, "NotHaveResult", string.Empty);

            return JsonConvert.DeserializeObject<(bool result, string error, string originalType)>(result);
        }
    }
}
