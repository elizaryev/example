using System.Collections.Generic;
using System.Threading.Tasks;
using DesignCommon.Model;

namespace ApiGatewayService.BusinessLogic
{
    public interface IProductService
    {
        Task<List<ProdTypeModel>> GetProdType();
        Task<ProdTypeModel> GetProdTypeById(string prodTypeId);

        Task<List<SpecInfoModel>> GetSpecInfo(string prodTypeId, string sizeDimension, int? prodTypeOptnDtl = null);

        Task<List<SizeDimensionModel>> GetAvailableSizeDimensionsViaSpecInfo(string prodTypeId);
        Task<SizeDimensionModel> GetSizeDimensionById(string sizeDimension);

        Task<List<ProdTypeOptnModel>> GetAvailableOptionsViaSpecInfo(string prodTypeId, string sizeDimension);
        Task<ProdTypeOptnModel> GetProdTypeOptnById(string optnId, string optnDtlAbbr = "");

        Task<DesignSpecModel> GetDesignSpecModel(string prodTypeId, string sizeDimension,
            DesignSpecRequestParams requestParams, string prodId="");

        Task<List<MaterialStockModel>> GetMaterialStockList(string prodTypeId, string sizeDimension, string sideCount);

        Task<(int price, int optnPrice, bool hasPrice, bool hasOptnPrice)> CalculationSinglePriceValues(SinglePriceRequest data);
        Task<(int price, int optnPrice, bool hasPrice, bool hasOptnPrice)> CalculateMultiPagePrice(MultiPriceRequest data);

        Task<List<ProdModel>> GetProd(int? prodTypeKey, string sizeDimension, string material, int? sideCount, bool? multiPageFlg);
    }
}
