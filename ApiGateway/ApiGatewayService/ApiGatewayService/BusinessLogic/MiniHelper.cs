using System.Collections.Generic;
using System.Threading.Tasks;
using DesignCommon.Model;

namespace ApiGatewayService.BusinessLogic
{
    public class MiniHelper: IMiniHelper
    {
        private readonly DesignClient.IMiniHelper _miniHelper;

        public MiniHelper(DesignClient.IMiniHelper miniHelper)
        {
            _miniHelper = miniHelper;
        }

        public async Task<List<RecordHtmlModel>> GetMaterialInfo(string prodTypeId, string activeDate, string version,
            string materialStock, bool multiPage)
        {
            return await _miniHelper.GetMaterialInfo(new MiniHelperRequest
            {
                ProdTypeId = prodTypeId,
                ActiveDate = activeDate,
                Version = version,
                MaterialStock = materialStock,
                MultiPage = multiPage
            });
        }

        public async Task<RecordHtmlModel> GetDaysNeededInfo(string prodTypeId, string activeDate, string version)
        {
            return await _miniHelper.GetDaysNeededInfo(new MiniHelperRequest
            {
                ProdTypeId = prodTypeId,
                ActiveDate = activeDate,
                Version = version
            });
        }

        public async Task<List<ProdTypeZipModel>> GetProdTypeZip(string prodTypeId, Dictionary<string, string> parameters = null)
        {
            return await _miniHelper.GetProdTypeZip(new MiniHelperRequest
            {
                ProdTypeId = prodTypeId,
                Parameters = parameters
            });
        }
    }
}
