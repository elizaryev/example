using System.Collections.Generic;
using System.Threading.Tasks;
using DesignCommon.Model;
using PublishingCommon.Model;

namespace Publishing.BusinessLogic
{
    public interface IOrderService
    {
        Task<int> GetCountStgOrderDtl();

        Task<(bool result, string error, string originalType)> ProcessMyCartData(string sourceHash, int price, int optnPrice,
            ProdTypeOptnModel prodTypeOptn, ProdModel prodModel, int orderQty, int printQty, 
            int prodTypeKey, string prodTypeId,
            bool hasCoverMaterial, bool hasPageMaterial, string jsonDesignParams = "");

        Task<(DesignSpecModel designSpecModel, int price, int optnPrice, Dictionary<string, string> additionalParamsDesignSpec)> GetMyCartItemDataByDesignHash(string designHash);
    }
}