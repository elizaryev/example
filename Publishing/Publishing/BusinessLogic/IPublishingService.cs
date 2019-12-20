using System.Collections.Generic;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using PublishingCommon.Enums;
using PublishingCommon.Model;

namespace Publishing.BusinessLogic
{
    public interface IPublishingService
    {
        Task<int> Save(JObject data);
        Task<bool> Remove(int wdmItem);

        Task<List<WdmItemModel>> GetPublishedList(PublishStatusType publishStatusType, JObject requestData);
        Task<List<WdmItemModel>> GetUnpublishedList(JObject data);
        Task<WdmItemModel> GetPublished(int wdmItem);
        Task<WdmItemModel> GetPublishedByHash(string hash);
        Task<List<WdmItemLogModel>> GetPublishProcessingLogs(int wdmItem);
        Task<bool> ChangePublishStatus(JObject model);
        Task<(bool result, string errMsg)> UpdateWdmItem(WdmItemModel itemData);

        Task<List<string>> GetPublishedItemNameList(string wdmCategoryId, bool onlyMember);
    }
}
