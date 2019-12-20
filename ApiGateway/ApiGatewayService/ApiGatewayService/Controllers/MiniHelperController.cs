using System.Linq;
using System.Threading.Tasks;
using ApiGatewayCommon;
using ApiGatewayService.BusinessLogic;
using DesignCommon.Model;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace ApiGatewayService.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    [Route("api/MiniHelper")]
    public class MiniHelperController : Controller
    {
        private readonly IMiniHelper _miniHelper;

        public MiniHelperController(IMiniHelper miniHelper)
        {
            _miniHelper = miniHelper;
        }

        [HttpPost("material")]
        public async Task<ActionResult> GetMaterialInfo([FromBody] MiniHelperRequest data)
        {
            if (!data.Valid())
                return BadRequest();

            var result = await _miniHelper.GetMaterialInfo(data.ProdTypeId, data.ActiveDate, data.Version,
                data.MaterialStock, data.MultiPage);
            return Ok(new Result(result.Select(s => new
            {
                s.Html,
                height = s.PreviewHeightInPixel,
                width = s.PreviewWidthInPixel,
                s.MultiPageType,
                s.MultiPageTypeDescr
            })));
        }

        [HttpPost("daysneeded")]
        public async Task<ActionResult> GetDaysNeededInfo([FromBody] MiniHelperRequest data)
        {
            if (!data.Valid())
                return BadRequest();

            var result = await _miniHelper.GetDaysNeededInfo(data.ProdTypeId, data.ActiveDate, data.Version);
            return Ok(new Result(result));
        }

        [HttpPost("prodtypezip")]
        public async Task<ActionResult> GetProdTypeZipInfo([FromBody] MiniHelperRequest data)
        {
            if (string.IsNullOrEmpty(data.ProdTypeId))
                return BadRequest();

            var result = await _miniHelper.GetProdTypeZip(data.ProdTypeId, data.Parameters);
            return Ok(new Result(result));
        }
    }
}
