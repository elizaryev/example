using System.Collections.Generic;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using PublishingCommon.Model;

namespace PublishingClient
{
    public interface IPublishingService
    {
        Task<int> SavePublishing(WdmItemModel publishingData, bool allImmediately);
        Task<bool> Remove(int wdmItem);
        Task<List<WdmItemModel>> GetPublishedList(string publishStatusType, JObject requestData);
        Task<List<WdmItemModel>> GetUnpublishedList(JObject data);
        Task<WdmItemModel> GetPublished(int wdmItem);
        Task<WdmItemModel> GetPublishedByHash(string hash);
        Task<List<WdmItemLogModel>> GetPublishProcessingLogs(int wdmItem);
        Task<bool> Update(WdmItemModel wdmItem, WdmItemLogModel log);
        Task<(bool result, string errMsg)> UpdateWdmItem(WdmItemModel itemData);
    }
}
