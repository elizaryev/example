using System.Collections.Generic;
using System.Threading.Tasks;
using ApiGatewayCommon;
using ApiGatewayService.BusinessLogic;
using ApiGatewayService.Middleware;
using DesignCommon.Model;
using EnsureThat;
using GalleryCommon.Model;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using ParserClient.Model;

namespace ApiGatewayService.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    [Route("api/DesignParameter")]
    public class DesignParameterController : Controller
    {
        private readonly DesignClient.IDesignService _designParameterService;
        private readonly GalleryClient.IGalleryService _galleryService;
        

        public DesignParameterController(DesignClient.IDesignService designParameterService, GalleryClient.IGalleryService galleryService)
        {
            _designParameterService = designParameterService;
            _galleryService = galleryService;
        }
        
        [HttpGet("{*designName}")]
        public async Task<ActionResult> Get(string designName, bool? loadModel)
        {
            //Ensure.That(designName).IsNotNullOrEmpty();
            DesignParameterModel result = await _designParameterService.GetByDesignName(designName, loadModel);

            return Ok(new Result(result));
        }

        [HttpPost("save/{*hash}")]
        public async Task<ActionResult> SaveDesignParameters(string hash,[FromBody] DesignParameterModel designParameterModel)
        {
            var result = await _designParameterService.SaveDesignParameters(hash, designParameterModel);
            var callResult = await _galleryService.GetGalleryItemByRepoHash(hash, GalleryItemType.Design);
            return Ok(new Result(callResult));
        }


        [HttpPost("generate/proof")]
        public async Task<List<ParserResult>> GenerateProofPreview([FromBody] JObject requestData)
        { 
            string sourcePath = null;
            string[] parserResultIds = null;
            string outputFormat = null;
            string viewMode = null;
            string destinationRepoPath = null;

            if (requestData == null)
                return new List<ParserResult>();

            if (requestData.ContainsKey("sourcePath"))
                sourcePath = requestData["sourcePath"].ToObject<string>();
            if (requestData.ContainsKey("parserResultIds"))
                parserResultIds = requestData["parserResultIds"].ToObject<string[]>();
            if (requestData.ContainsKey("outputFormat"))
                outputFormat = requestData["outputFormat"].ToObject<string>();
            if (requestData.ContainsKey("viewMode"))
                viewMode = requestData["viewMode"].ToObject<string>();
            if (requestData.ContainsKey("destinationRepoPath"))
                destinationRepoPath = requestData["destinationRepoPath"].ToObject<string>();

            var result = await _designParameterService.GenerateParserContent(sourcePath, parserResultIds, outputFormat,
                viewMode, destinationRepoPath);
            return result;
        }

        [HttpPost("mploadpage/{*hash}")]
        public Task<DesignParameterModel> MultiPageLoadPage(string hash, [FromBody] DesignModel designModel)
        {
            return _designParameterService.MultiPageLoadPage(hash, designModel);
        }

        [HttpPost("mpmovepages")]
        public Task<bool> MultiPageMovePages([FromBody] string[] hashes)
        {
            return _designParameterService.MultiPageMovePages(hashes);
        }

        [HttpPost("mpdeletepages")]
        public Task<MultiPageInsertDeleteResult> MultiPageDeletePages([FromBody] string[] hashes)
        {
            return _designParameterService.MultiPageDeletePages(hashes);
        }

        [HttpGet("mpinsertpages/{atHash}")]
        public Task<MultiPageInsertDeleteResult> MultiPageInsertPages(string atHash)
        {
            return _designParameterService.MultiPageInsertPages(atHash);
        }

        [HttpPost("mpcopypage/{sourceHash}")]
        public Task<MultiPageInsertDeleteResult> MultiPageCopyPage(string sourceHash, [FromBody] MultiPageCopyPageRequestParams data)
        {
            return _designParameterService.MultiPageCopyPage(sourceHash, data);
        }

        [HttpGet("mprestartdesign/{hash}")]
        public Task<MultiPageInsertDeleteResult> MultiPageRestartDesign(string hash)
        {
            return _designParameterService.MultiPageRestartDesign(hash);
        }
    }
}
