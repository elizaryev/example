using System.Collections.Generic;
using System.Threading.Tasks;
using ApiGatewayService.BusinessLogic;
using ApiGatewayService.Middleware;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using ParserClient.Model;

namespace ApiGatewayService.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    [Route("api/Parser")]
    public class ParserController : Controller
    {
        private readonly IParserService _parserService;

        public ParserController(IParserService parserService)
        {
            _parserService = parserService;
        }

        //[MiddlewareFilter(typeof(AuthenticationPipeline))]
        //[HttpGet("{designName}")]
        //public async Task<List<DesignParameter>> Get(string designName)
        //{
        //    Ensure.That(designName).IsNotNullOrEmpty();
        //    return await _designParameterService.GetByDesignName(designName);
        //}

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [HttpPost("render")]
        public async Task<List<ParserResult>> Render([FromBody]ParserData parserData)
        {
            //Ensure.That(designName).IsNotNullOrEmpty();
            var result = await _parserService.Render(parserData);
            return result;
        }
    }
}
