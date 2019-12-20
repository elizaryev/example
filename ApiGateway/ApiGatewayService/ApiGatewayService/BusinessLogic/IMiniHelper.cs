using System.Collections.Generic;
using System.Threading.Tasks;
using DesignCommon.Model;

namespace ApiGatewayService.BusinessLogic
{
    public interface IMiniHelper
    {
        Task<List<RecordHtmlModel>> GetMaterialInfo(string prodTypeId, string activeDate, string version, string materialStock, bool multiPage);
        Task<RecordHtmlModel> GetDaysNeededInfo(string prodTypeId, string activeDate, string version);
        Task<List<ProdTypeZipModel>> GetProdTypeZip(string prodTypeId, Dictionary<string, string> parameters = null);
    }
}