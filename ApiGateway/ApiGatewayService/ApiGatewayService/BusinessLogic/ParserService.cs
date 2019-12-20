using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;
using ParserClient.Model;

namespace ApiGatewayService.BusinessLogic
{
    public class ParserService: IParserService
    {
        private readonly ParserClient.IParserService _parserService;
        private readonly string _parserDefaultRenderingPageUrl;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ParserService(ParserClient.IParserService parserService, string parserDefaultRenderingPageUrl,
            IHttpContextAccessor httpContextAccessor = null)
        {
            _parserService = parserService;
            _parserDefaultRenderingPageUrl = parserDefaultRenderingPageUrl;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<ParserResult>> Render(ParserData parserData)
        {
            //Duplicate response and return a file
            // Use configured rendering url
            parserData.Url = _parserDefaultRenderingPageUrl;
            if (parserData.Config == null)
            {
                parserData.Config = new HeadlessBrowserConfig();
                
            }

            //todo:need to also add a CartOrderId
            //parserData.Config.CartOrderId = 
            if(string.IsNullOrEmpty(parserData.Config.Token))
                parserData.Config.Token = _httpContextAccessor.HttpContext.Request.Headers["token"].ToString();

            return await _parserService.Render(parserData);          
            //var bytes = await response.Content.ReadAsByteArrayAsync();
            //return new FileContentResult(bytes, MediaTypeHeaderValue.Parse(response.Content.Headers.ContentType.ToString()));
        }
    }
}
