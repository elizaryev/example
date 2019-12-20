using System.Threading.Tasks;
using ApiGatewayCommon;
using ApiGatewayService.BusinessLogic;
using ApiGatewayService.Middleware;
using DesignCommon.Model;   
using GalleryCommon.Enum;
using GalleryCommon.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace ApiGatewayService.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]    
    public class GalleryController : Controller
    {
        private readonly IGalleryService _galleryService;
        private readonly GalleryClient.IGalleryService _galleryClientService;
        private readonly GalleryClient.IGalleryOperationService _galleryOperationClientService;

        public GalleryController(IGalleryService galleryService, GalleryClient.IGalleryService galleryClientService,
            GalleryClient.IGalleryOperationService galleryOperationClientService)
        {
            _galleryService = galleryService;
            _galleryClientService = galleryClientService;
            _galleryOperationClientService = galleryOperationClientService;
        }

        //[MiddlewareFilter(typeof(AuthenticationPipeline))]
        // GET api/gallery
        [Route("api/[controller]")]
        [HttpGet]
        public async Task<ActionResult> Get(string type)
        {
            //Ensure.That(type).IsNotNullOrEmpty();
            var result = await _galleryService.GetGalleries(type == GalleryType.Public.ToString() ? GalleryType.Public : GalleryType.Private );
            return Ok(result);
        }

        [Route("api/gitem/{*hash}")]
        [HttpGet]
        public async Task<GalleryItem> GetGalleryItemByRepoHash(string hash, [FromQuery]string galleryType)
        {
            return await _galleryService.GetGalleryItemByRepoHash(hash, galleryType);
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [Route("api/[controller]/items/{*path}")]
        [HttpPost]
        public async Task<ActionResult> GetItems(string path, [FromBody] JObject data)
        {
            int start, take = 0;
            bool hasOffset = false;
            bool validOffset = false;
            (validOffset, hasOffset, start, take) = _galleryService.ValidationOffsetParams(data);
            if (hasOffset && !validOffset)
                return BadRequest();

            var result = await _galleryService.GetItems(path, hasOffset ? start: (int?) null, hasOffset ? take : (int?) null );
            return Ok(result);
        }
        

        [Route("api/[controller]/published/{category}")]
        [HttpPost]
        public async Task<ActionResult> GetPublishedItems(string category, [FromBody] JObject requestData)
        {
            var result = await _galleryClientService.GetPublishedItems(category, requestData);
            return Ok(new Result(result));
        }

        [Authorize(Policy = "IsMember")]
        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [Route("api/[controller]/item/list/unpublish")]
        [HttpPost]
        public async Task<ActionResult> GetUnpublishingList([FromBody] JObject data)
        {
            var result = await _galleryClientService.GetUnpublishedItems(data);
            return Ok(new Result
            {
                Code = result.success ? 0 : 500,
                Value = result.items,
                Message = result.errMsg
            });
        }

        //[MiddlewareFilter(typeof(AuthenticationPipeline))]
        // GET api/gallery/vector/somepath/item22
        [Route("api/gallerymedia/{*path}")]
        [HttpGet]
        public async Task<ActionResult> GetGalleryItemViewMedia(string path, [FromQuery]string type, [FromQuery]string galleryItemType)
        {
            var result = await _galleryService.GetGalleryItemViewMedia(path, type, galleryItemType);
            return Ok(result);
        }

        [Route("api/gallerymedia/{*hash}")]
        public async Task<IActionResult> GetGalleryItemGraphic(string hash)
        {
            var result = await _galleryService.GetGalleryItemGraphic(hash);
            return result;
        }


        [Route("api/designmedia/{*hash}")]
        [HttpGet]
        public async Task<IActionResult> GetDesignItemGraphic(string hash, [FromQuery]string outputType = WDMFileTypes.Screen, string loginData = "")
        {
            var result = await _galleryService.GetDesignItemGraphic(hash, "", outputType, string.IsNullOrEmpty(loginData) ? null : JObject.Parse(loginData));
            return result;
        }

        //[Route("api/designupload/{*hash}")]
        //[HttpPost]
        //public async Task<IEnumerable<ViewMediaImage>> UploadGraphicToDesign(string hash, IFormFileCollection files)
        //{
        //    return await _galleryService.UploadDesignItemGraphic(Request);
        //}

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [Route("api/gop/addtodesign")]
        [HttpPost]
        public async Task<ViewMediaImage> AddGalleryItemToDesign(string hash, string type, string designHash, bool isInMyCloud, string generatedHash = "")
        {
            var result = await _galleryService.AddGalleryItemToDesign(hash, type, designHash, isInMyCloud, generatedHash);
            return result;
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [Route("api/gop/adddtod")]
        [HttpPost]
        public async Task<DesignModel> AddDesignToDesign(string hash, string designHash, int sideNumber = -1)
        {
            var result = await _galleryService.AddDesignToDesign(hash, designHash, sideNumber);
            return result;
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [Route("api/gop/item/delete/{*hash}")]
        [HttpPost]
        public async Task<bool> DeleteItem(string hash)
        {
            return await _galleryService.DeleteItem(hash);
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [Route("api/gop/item/move/{*sourceHash}")]
        [HttpPost]
        public async Task<bool> MoveItem(string sourceHash, [FromBody] JObject requestData)
        {
            return await _galleryOperationClientService.MoveItem(sourceHash, requestData);
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [Route("api/gop/folder/create/{*hash}")]
        [HttpPost]
        public async Task<GalleryItem> CreateFolder(string hash, string folderName)
        {
            return await _galleryService.CreateFolder(hash, folderName);
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [Route("api/gop/folder/{*hash}")]
        [HttpPost]
        public async Task<bool> RenameFolder(string hash, string newName)
        {
            return await _galleryService.RenameFolder(hash, newName);
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [Route("api/gop/folder/{*hash}")]
        [HttpDelete]
        public async Task<bool> DeleteFolder(string hash)
        {
            return await _galleryService.DeleteFolder(hash);
        }

        [Authorize(Policy = "IsMember")]
        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [Route("api/gop/savetomycloud/{*sourceHash}")]
        [HttpPost]
        public async Task<Result> SaveDesignToMyCloud(string sourceHash, string destination, string designName, string size, string data = "",
            string[] parserResultIds = null, bool force = false)
        {
            return await _galleryService.SaveDesignToMyCloud(sourceHash, destination, designName, size, data, parserResultIds, force);
        }

        [Route("api/gop/reloadmodel/{*sourceHash}")]
        [HttpPost]
        public async Task<DesignParameterModel> ReloadDesignModel(string sourceHash, string destinationHash,
            int side = -1)
        {
            return await _galleryService.ReloadDesignModel(sourceHash, destinationHash, side);
        }

    }
}
