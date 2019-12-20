using System.Collections.Generic;
using System.Threading.Tasks;
using DesignCommon.Model;

namespace ApiGatewayService.BusinessLogic
{
    public class ProductService: IProductService
    {
        private DesignClient.IProductService _productService;

        public ProductService(DesignClient.IProductService productService)
        {
            _productService = productService;
        }


        public async Task<List<ProdTypeModel>> GetProdType()
        {
            return await _productService.GetProdType();
        }

        public async Task<ProdTypeModel> GetProdTypeById(string prodTypeId)
        {
            return await _productService.GetProdTypeById(prodTypeId);
        }

        public async Task<List<ProdModel>> GetProd(int? prodTypeKey, string sizeDimension, string material, int? sideCount,
            bool? multiPageFlg)
        {
            return await _productService.GetProd(prodTypeKey, sizeDimension, material, sideCount, multiPageFlg);
        }

        public async Task<List<SpecInfoModel>> GetSpecInfo(string prodTypeId, string sizeDimension, int? prodTypeOptnDtl = null)
        {
            return await _productService.GetSpecInfo(prodTypeId, sizeDimension, prodTypeOptnDtl);
        }

        public async Task<List<SizeDimensionModel>> GetAvailableSizeDimensionsViaSpecInfo(string prodTypeId)
        {
            return await _productService.GetAvailableSizeDimensionsViaSpecInfo(prodTypeId);
        }

        public async Task<SizeDimensionModel> GetSizeDimensionById(string sizeDimension)
        {
            return await _productService.GetSizeDimensionById(sizeDimension);
        }

        public async Task<List<MaterialStockModel>> GetMaterialStockList(string prodTypeId, string sizeDimension, string sideCount)
        {
            return await _productService.GetMaterialStockList(prodTypeId, sizeDimension, sideCount);
        }

        public async Task<List<ProdTypeOptnModel>> GetAvailableOptionsViaSpecInfo(string prodTypeId, string sizeDimension)
        {
            return await _productService.GetAvailableOptionsViaSpecInfo(prodTypeId, sizeDimension);
        }

        public async Task<ProdTypeOptnModel> GetProdTypeOptnById(string optnId, string optnDtlAbbr = "")
        {
            return await _productService.GetProdTypeOptnById(optnId, optnDtlAbbr);
        }

        public async Task<DesignSpecModel> GetDesignSpecModel(string prodTypeId, string sizeDimension,
            DesignSpecRequestParams requestParams, string prodId = "")
        {
            return await _productService.GetDesignSpecModel(prodTypeId, sizeDimension, requestParams, prodId);
        }

        public async Task<(int price, int optnPrice, bool hasPrice, bool hasOptnPrice)> CalculationSinglePriceValues(SinglePriceRequest data)
        {
            return await _productService.CalculationSinglePriceValues(data);
        }

        public async Task<(int price, int optnPrice, bool hasPrice, bool hasOptnPrice)> CalculateMultiPagePrice(
            MultiPriceRequest data)
        {
            return await _productService.CalculateMultiPagePrice(data);
        }
    }
}
