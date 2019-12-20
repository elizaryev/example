using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using PublishingCommon.Model;

namespace PublishingClient
{
    public class RatingService: IRatingService
    {
        private readonly string _ratingServiceUrl;

        public RatingService(string ratingServiceUrl)
        {
            _ratingServiceUrl = ratingServiceUrl;
        }

        public async Task<int> Save(WdmRatingModel itemData)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient()) 
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(itemData)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync($"{_ratingServiceUrl}/create", content);
            }

            var result = await response.Content.ReadAsStringAsync();
            int.TryParse(result, out var res);
            return res;
        }

        public async Task<WdmRatingModel> GetRating(string rater, string appointment)
        {
            HttpResponseMessage response;
            string uri = $"{_ratingServiceUrl}/{appointment}/{rater}";
            using (HttpClient client = new HttpClient())
            {
                response = await client.GetAsync(uri);
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return null;

            return JsonConvert.DeserializeObject<WdmRatingModel>(result);
        }

        public async Task<List<WdmRatingModel>> GetRatingList(string appointment)
        {
            HttpResponseMessage response;
            string uri = $"{_ratingServiceUrl}/{appointment}";
            using (HttpClient client = new HttpClient())
            {
                response = await client.GetAsync(uri);
            }

            string result = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(result))
                return null;

            return JsonConvert.DeserializeObject<List<WdmRatingModel>>(result);
        }

        public async Task<bool> UpdateRating(WdmRatingModel itemData)
        {
            HttpResponseMessage response;
            using (HttpClient client = new HttpClient())
            {
                ByteArrayContent byteArrayContent = new ByteArrayContent(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(itemData)));
                byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var content = (HttpContent)byteArrayContent;

                response = await client.PostAsync(_ratingServiceUrl, content);
            }

            var result = await response.Content.ReadAsStringAsync();
            bool.TryParse(result, out var res);
            return res;
        }
    }
}
