using System.Threading.Tasks;
using ApiGatewayCommon;
using ApiGatewayService.BusinessLogic;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace ApiGatewayService.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    [Route("api/WdmResources")]
    public class WdmResourcesController : Controller
    {
        private readonly IWdmResourcesService _wdmResourcesService;

        public WdmResourcesController(IWdmResourcesService wdmResourcesService)
        {
            _wdmResourcesService = wdmResourcesService;
        }

        [HttpGet("fontgroup")]
        public async Task<ActionResult> GetFontGroupList([FromQuery] string siteID)
        {
            var result = await _wdmResourcesService.GetFontGroupList(siteID);
            return Ok(new Result(result));
        }

        [HttpGet("GetFontCss")]
        public IActionResult GetFontCss(string[] tfc)
        {
            var result = _wdmResourcesService.GetFontCss(tfc).Result;
            if (string.IsNullOrEmpty(result))
            {
                return NotFound();
            }

            return Content(result, "text/css");
        }

        [HttpGet("menuitems")]
        public async Task<ActionResult> GetMenuItemList()
        {
            var result = await _wdmResourcesService.GetMenuItemList();
            return Ok(new Result(result));
        }

        [HttpGet("wdmsettings")]
        public async Task<ActionResult> GetWdmSettings()
        {
            var result = await _wdmResourcesService.GetWdmSettings();

            //Filter values which aren't required on client side
            result.CircleShapeSpecSvgPath = null;
            result.CircleZonesRemarksSvgPath = null;
            result.OvalShapeSpecSvgPath = null;
            result.OvalZonesRemarksSvgPath = null;
            result.ParserBrowserScreenProofDpi = null;
            result.ParserMediumProofHeightInPixel = null;
            result.ParserMediumProofWidthInPixel = null;
            result.ParserPressDpi = null;
            result.ParserScreenProofDpi = null;
            result.ProofWatermarkSvgPath = null;
            result.ProofWatermarkText = null;

            return Ok(new Result(result));
        }
    }
}
