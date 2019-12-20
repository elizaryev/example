using System.Collections.Generic;
using System.Threading.Tasks;
using ApiGatewayCommon;
using ApiGatewayService.Middleware;
using DesignCommon.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using PublishingCommon.Model;
using PublishingCommon.RequestModel;

namespace ApiGatewayService.Controllers
{
    [MiddlewareFilter(typeof(AuthenticationPipeline))]
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    [Route("api/Order")]
    public class OrderController : Controller
    {
        private readonly PublishingClient.IOrderService _orderService;

        public OrderController(PublishingClient.IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpGet("stage/detail/count")]
        public async Task<ActionResult> GetCountStageOrderDetail()
        {
            var result = await _orderService.GetCountStgOrderDtl();
            return Ok(new Result() {Value = result});
        }

        [Authorize(Policy = "IsMember")]
        [HttpPost("mycart/create")]
        public async Task<ActionResult> CreateToMyCartAction([FromBody]CreatingMyCartRequest requestData)
        {
            var result = await _orderService.ProcessMyCartData(requestData);
            return Ok(new Result()
            {
                Code = !string.IsNullOrEmpty(result.error) ? 500 : 0,
                Value = new { success = result.result, originalType = result.originalType },
                Message = result.error
            });
        }

        [HttpGet("mycart/item/{*designHash}")]
        public async Task<ActionResult> GetMyCartItemDataByDesignHash(string designHash)
        {
            var result = await _orderService.GetMyCartItemDataByDesignHash(designHash);
            return Ok(new Result(new
            {
                result.designSpecModel, result.price, result.optnPrice,
                result.additionalParamsDesignSpec
            }));
        }
    }
}
