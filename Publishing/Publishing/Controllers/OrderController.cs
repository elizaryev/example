using System.Collections.Generic;
using System.Threading.Tasks;
using DesignCommon.Model;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Publishing.BusinessLogic;
using PublishingCommon.Model;
using PublishingCommon.RequestModel;

namespace Publishing.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    [Route("api/Order")]
    public class OrderController : Controller
    {
        private readonly IOrderService _orderService;

        public OrderController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpGet("stage/detail/count")]
        public async Task<int> GetCountStageOrderDetail()
        {
            return await _orderService.GetCountStgOrderDtl();
        }

        [HttpPost("mycart/create")]
        public async Task<(bool result, string error, string originalType)> ProcessMyCartData([FromBody]CreatingMyCartRequest request)
        {
            return await _orderService.ProcessMyCartData(request.SourceHash, request.Price, request.OptnPrice,
                request.ProdTypeOptn, request.ProdData, request.OrderQty, request.PrintQty, 
                request.ProdTypeKey, request.ProdTypeId, request.HasCoverMaterial, request.HasPageMaterial, request.JsonDesignParams);
        }

        [HttpGet("mycart/item/{*designHash}")]
        public async Task<(DesignSpecModel designSpecModel, int price, int optnPrice,
            Dictionary<string, string> additionalParamsDesignSpec)> GetMyCartItemDataByDesignHash(string designHash)
        {
            return await _orderService.GetMyCartItemDataByDesignHash(designHash);
        }
    }
}
