using System.Collections.Generic;
using System.Threading.Tasks;
using DesignCommon.Model;
using PublishingCommon.RequestModel;

namespace PublishingClient
{
    public interface IOrderService
    {
        Task<int> GetCountStgOrderDtl();

        Task<(bool result, string error, string originalType)> ProcessMyCartData(CreatingMyCartRequest request);

        Task<(DesignSpecModel designSpecModel, int price, int optnPrice,
            Dictionary<string, string> additionalParamsDesignSpec)> GetMyCartItemDataByDesignHash(string designHash);
    }
}