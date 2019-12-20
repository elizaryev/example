using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using PublishingCommon.Model;

namespace PublishingClient
{
    public class CategorySevice: ICategorySevice
    {
        private readonly string _categoryServiceUrl;
        private readonly string _subcategoryServiceUrl;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CategorySevice(string categoryServiceUrl, string subcategoryServiceUrl, 
            IHttpContextAccessor httpContextAccessor = null)
        {
            _categoryServiceUrl = categoryServiceUrl;
            _subcategoryServiceUrl = subcategoryServiceUrl;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<WdmCategoryModel>> GetCategoryList()
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                response = await client.GetAsync(_categoryServiceUrl);
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return null;

            return JsonConvert.DeserializeObject<List<WdmCategoryModel>>(result);
        }

        public async Task<List<WdmSubCategoryModel>> GetSubCategoryList(string wdmCategoryId)
        {
            HttpResponseMessage response;
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri($"{_subcategoryServiceUrl}?wdmCategoryId={wdmCategoryId}"),
                Method = HttpMethod.Get,
            };
            request.Headers.Add("token", _httpContextAccessor.HttpContext.Request.Headers["token"].ToString());

            using (HttpClient client = new HttpClient())
            {
                response = await client.SendAsync(request);
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return null;

            return JsonConvert.DeserializeObject<List<WdmSubCategoryModel>>(result);
        }

        public async Task<int> SaveSubCategory(WdmSubCategoryModel subcategory)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(subcategory)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_subcategoryServiceUrl}/create", content);
            }

            var result = await response.Content.ReadAsStringAsync();
            int.TryParse(result, out var res);
            return res;
        }
    }
}
