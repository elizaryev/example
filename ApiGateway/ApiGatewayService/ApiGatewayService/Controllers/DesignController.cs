using System.Threading.Tasks;
using ApiGatewayCommon;
using ApiGatewayService.BusinessLogic;
using ApiGatewayService.Middleware;
using DesignCommon.Model;
using EnsureThat;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace ApiGatewayService.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    [Route("api/design")]
    public class DesignController : Controller
    {
        private readonly DesignClient.IDesignService _designService;

        public DesignController(DesignClient.IDesignService designService)
        {
            _designService = designService;
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [HttpGet("representation")]
        public async Task<ActionResult> Get()
        {
            var result = await _designService.GetRepresentationDesignModels();
            return Ok(new Result(result));
        }

        /**
         * We are expecting subtype=="model"
         * Returns json
         */
        
        [HttpGet("{designName}/{subtype}")]
        public async Task<DesignModel> Get(string designName, string subtype)
        {
            Ensure.That(designName).IsNotNullOrEmpty();
            Ensure.That(subtype).IsEqualTo("model");
            return await _designService.GetDesignModel(designName);
        }

        [HttpGet("updenv/{*hash}")]
        public async Task<IActionResult> UpdateDesignEnvironment(string hash)
        {
            bool result = await _designService.UpdateDesignEnvironment(hash);
            return Ok(result);
        }

        [HttpPost("wdmentry/{*designHash}")]
        public async Task<IActionResult> WdmEntryPoint(string designHash, [FromBody] JObject requestData)
        {
            bool result = await _designService.WdmEntryPoint(designHash, requestData);
            return Ok(result);
        }
    }
}
