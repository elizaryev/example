using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EnsureThat;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using Publishing.BusinessLogic;
using PublishingCommon.Enums;
using PublishingCommon.Model;

namespace Publishing.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Route("api/[controller]")]
    public class PublishingController : Controller
    {
        private readonly IPublishingService _publishingService;

        public PublishingController(IPublishingService publishingService)
        {
            _publishingService = publishingService;
        }

        [HttpPost("item/list/{publishStatusType}")]
        public async Task<List<WdmItemModel>> GetPublishingList(string publishStatusType, [FromBody] JObject requestData)
        {
            var status = (PublishStatusType)Enum.Parse(typeof(PublishStatusType), publishStatusType);
            return await _publishingService.GetPublishedList(status, requestData);
        }

        [HttpPost("item/list/unpublish")]
        public async Task<List<WdmItemModel>> GetUnpublishingList([FromBody] JObject data)
        {
            return await _publishingService.GetUnpublishedList(data);
        }

        [HttpDelete("{wdmItem}")]
        public async Task<bool> Remove(int wdmItem)
        {
            return await _publishingService.Remove(wdmItem);
        }

        [HttpGet("item/{wdmItem}")]
        public async Task<WdmItemModel> GetPublished(int wdmItem)
        {
            return await _publishingService.GetPublished(wdmItem);
        }

        [HttpGet("item/published/names")]
        public async Task<List<string>> GetPublishedItemNameList([FromQuery] string wdmCategoryId, [FromQuery] bool onlyMember)
        {
            return await _publishingService.GetPublishedItemNameList(wdmCategoryId, onlyMember);
        }

        [HttpGet("item/hash/{*hash}")]
        public async Task<WdmItemModel> GetPublishedByHash(string hash)
        {
            return await _publishingService.GetPublishedByHash(hash);
        }

        [HttpPost("item/update")]
        public async Task<(bool result, string errMsg)> UpdateWdmItem([FromBody] WdmItemModel model)
        {
            return await _publishingService.UpdateWdmItem(model);
        }

        [HttpGet("log/{wdmItem}")]
        public async Task<List<WdmItemLogModel>> GetPublishProcessingLogs(int wdmItem)
        {
            return await _publishingService.GetPublishProcessingLogs(wdmItem);
        }

        // PUT api/Publishing
        [HttpPost("save")]
        public async Task<int> Save([FromBody] JObject data)
        {
            return await _publishingService.Save(data);
        }

        [HttpPost("update")]
        public async Task<bool> ChangePublishStatus([FromBody] JObject model)
        {
            return await _publishingService.ChangePublishStatus(model);
        }
    }
}
