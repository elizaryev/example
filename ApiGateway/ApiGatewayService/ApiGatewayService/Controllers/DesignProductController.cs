using System.Collections.Generic;
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
    [Route("api/prod")]
    public class DesignProductController : Controller
    {
        private readonly IProductService _productService;

        public DesignProductController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpGet("prodtype")]
        public async Task<IActionResult> GetProdType()
        {
            var prodTypes = await _productService.GetProdType();
            return Ok(prodTypes.Select((pt) => new
            {
                pt.ProdTypeKey,
                pt.ProdTypeId,
                pt.Description,
                pt.GraphicFile,
                pt.OrderQtyList,
                pt.MultiPageFlg
            }));
        }

        [HttpGet("prodtype/{prodTypeId}")]
        public async Task<IActionResult> GetProdTypeById(string prodTypeId)
        {
            var pt = await _productService.GetProdTypeById(prodTypeId);
            return Ok(new
            {
                pt.ProdTypeKey,
                pt.ProdTypeId,
                pt.Description,
                pt.GraphicFile,
                pt.OrderQtyList,
                pt.MultiPageFlg
            });
        }

        [HttpGet("prod")]
        public async Task<IActionResult> GetProd(int? prodTypeKey, string sizeDimension, string material,
            int? sideCount, bool? multiPageFlg)
        {
            var result = await _productService.GetProd(prodTypeKey, sizeDimension, material, sideCount, multiPageFlg);
            return Ok(new Result(result));
        }

        [HttpGet("specinfo")]
        public async Task<IActionResult> GetSpecInfo(string prodTypeId, string sizeDimension, int? prodTypeOptnDtl = null)
        {
            return Ok(await _productService.GetSpecInfo(prodTypeId, sizeDimension, prodTypeOptnDtl));
        }

        [HttpGet("size")]
        public async Task<IActionResult> GetAvailableSizeDimensionsViaSpecInfo(string prodTypeId)
        {
            var sizeDimensions = await _productService.GetAvailableSizeDimensionsViaSpecInfo(prodTypeId);
            return Ok(sizeDimensions.Select(sd => new
            {
                sd.SizeDimension,
                sd.Description,
                sd.SizeW,
                sd.SizeH,
                sd.SizeWDesign,
                sd.SizeHDesign,
                sd.SizeUmId,
                sd.BleedMarginPerSide,
                sd.SafeMarginPerSide
            }));
        }

        [HttpGet("size/{sizeDimension}")]
        public async Task<IActionResult> GetSizeDimensionById(string sizeDimension)
        {
            var sd = await _productService.GetSizeDimensionById(sizeDimension);
            return Ok(new
            {
                sd.SizeDimension,
                sd.Description,
                sd.SizeW,
                sd.SizeH,
                sd.SizeWDesign,
                sd.SizeHDesign,
                sd.SizeUmId,
                sd.BleedMarginPerSide,
                sd.SafeMarginPerSide
            });
        }

        [HttpGet("material")]
        public async Task<IActionResult> GetMaterialStockList(string prodTypeId, string sizeDimension, string sideCount)
        {
            var materials = await _productService.GetMaterialStockList(prodTypeId, sizeDimension, sideCount);
            return Ok(materials.Select(material => new
            {
                material.MaterialStockKey,
                material.MaterialStockAbbr,
                material.Description
            }));
        }

        [HttpGet("options")]
        public async Task<IActionResult> GetAvailableOptionsViaSpecInfo(string prodTypeId, string sizeDimension)
        {
            var optns = await _productService.GetAvailableOptionsViaSpecInfo(prodTypeId, sizeDimension);
            return Ok(optns.Select(optn => new
            {
                optn.ProdTypeOptnId,
                optn.Description,
                prodTypeOptnDtl = optn.ProdTypeOptnDtl.Select(optnDtl => new
                {
                    optnDtl.ProdTypeOptnDtlKey,
                    optnDtl.ProdTypeOptnDtlAbbr,
                    optnDtl.Description,
                    optnDtl.MiniGraphicUrl,
                    optnDtl.GraphicUrl,
                    optnDtl.UnitPrice,
                    optnDtl.SortOrder,
                    optnDtl.OrderQtyList,
                    optnDtl.OrderQtyPriceList,
                    optnDtl.ExcessDeltaOrderQty,
                    optnDtl.ExcessDeltaPrice,
                    optnDtl.ExcessDiscountDeltaOrderQty,
                    optnDtl.ExcessDiscountDeltaDiscPct,
                    optnDtl.ExcessMaxDiscPct,
                    optnDtl.ZeroTaxFlg,
                    optnDtl.SizeName
                })
            }));
        }

        [HttpGet("options/{optnId}/{optnDtlAbbr?}")]
        public async Task<IActionResult> GetProdTypeOptnById(string optnId, string optnDtlAbbr = "")
        {
            return Ok(await _productService.GetProdTypeOptnById(optnId, optnDtlAbbr));
        }

        [HttpPost("designspec/{prodTypeId}/{sizeDimension}/{prodId?}")]
        public async Task<IActionResult> GetDesignSpecModel(string prodTypeId,
            string sizeDimension, [FromBody] DesignSpecRequestParams requestParams,string prodId="")
        {
            var result = await _productService.GetDesignSpecModel(prodTypeId, sizeDimension, requestParams, prodId);
            var pt = result.prodTypeModel;
            var sd = result.sizeDimensionModel;
            var optn = result.prodTypeOptnModel;
            var si = result.specInfoModel;
            var matl = result.materialStockModel;
            var coverMatrl = result.CoverMaterialStockModel;
            var pageMatrl = result.PageMaterialStockModel;

            dynamic matlResult = null;
            if (matl != null)
            {
                matlResult = new
                {
                    matl.Description,
                    matl.MaterialStockAbbr
                };
            }
            dynamic coverMatlResult = null;
            if (coverMatrl != null)
            {
                coverMatlResult = new
                {
                    coverMatrl.Description,
                    coverMatrl.MaterialStockAbbr
                };
            }
            dynamic pageMatlResult = null;
            if (pageMatrl != null)
            {
                pageMatlResult = new
                {
                    pageMatrl.Description,
                    pageMatrl.MaterialStockAbbr
                };
            }

            return Ok(new
            {
                prodTypeModel = new
                {
                    pt.ProdTypeId,
                    pt.Description,
                    pt.MultiPageFlg
                },
                sizeDimension = new
                {
                    sd.SizeDimension,
                    sd.Description,
                    sd.SizeW,
                    sd.SizeH,
                    sd.SizeWDesign,
                    sd.SizeHDesign,
                    sd.SizeUmId,
                    sd.BleedMarginPerSide,
                    sd.SafeMarginPerSide
                },
                prodTypeOptnModel = optn == null ? null :
                    new
                    {
                        optn.ProdTypeOptnId,
                        optn.Description,
                        prodTypeOptnDtl = optn.ProdTypeOptnDtl.Select(optnDtl => new
                        {
                            optnDtl.ProdTypeOptnDtlKey,
                            optnDtl.ProdTypeOptnDtlAbbr,
                            optnDtl.Description,
                            optnDtl.MiniGraphicUrl,
                            optnDtl.GraphicUrl,
                            optnDtl.SortOrder,
                            optnDtl.UnitPrice,
                            optnDtl.OrderQtyList,
                            optnDtl.OrderQtyPriceList,
                            optnDtl.ExcessDeltaOrderQty,
                            optnDtl.ExcessDeltaPrice,
                            optnDtl.ExcessDiscountDeltaOrderQty,
                            optnDtl.ExcessDiscountDeltaDiscPct,
                            optnDtl.ExcessMaxDiscPct,
                            optnDtl.ZeroTaxFlg,
                            optnDtl.SizeName
                        }).ToList()
                    },
                // Filter unneeded fields for spec info model
                specInfoModel = si,
                materialStockModel = matlResult,
                coverMaterialStockModel = coverMatlResult,
                pageMaterialStockModel = pageMatlResult,
                designSpecShape = result.DesignSpecShape,
                zoneRemarkGraphic = result.zoneRemarkGraphic,
                prodTypeSpecGraphics = result.ProdTypeSpecGraphics,
                proofWatermarkSvgPath = result.proofWatermarkSvgPath,
                proofWatermarkText = result.proofWatermarkText
            });
        }

        [HttpPost("price/single")]
        public async Task<IActionResult> CalculationPriceValues([FromBody] SinglePriceRequest data)
        {
            bool? validInputParams = data?.Valid();
            if (!validInputParams.HasValue || !validInputParams.Value) return BadRequest();
            var result = await _productService.CalculationSinglePriceValues(data);
            return Ok(new Result(new {result.price, result.optnPrice/*, result.hasPrice, result.hasOptnPrice*/ }));
        }

        [HttpPost("price/multi")]
        public async Task<IActionResult> CalculateMultiPagePrice([FromBody] MultiPriceRequest data)
        {
            bool? validInputParams = data?.Valid();
            if (!validInputParams.HasValue || !validInputParams.Value) return BadRequest();
            var result = await _productService.CalculateMultiPagePrice(data);
            return Ok(new Result(new { result.price, result.optnPrice/*, result.hasPrice, result.hasOptnPrice*/ }));
        }
    }
}
