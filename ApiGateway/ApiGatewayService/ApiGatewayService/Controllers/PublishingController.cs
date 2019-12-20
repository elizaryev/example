using System.Collections.Generic;
using System.Threading.Tasks;
using ApiGatewayCommon;
using ApiGatewayService.BusinessLogic;
using ApiGatewayService.Entities;
using ApiGatewayService.Middleware;
using ApiGatewayService.Misc;
using EnsureThat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using PublishingCommon.Model;
using TokenManagerClient.Command;
using TokenManagerClient.Receiver;
using TokenManagerCommon.CommandParam;

namespace ApiGatewayService.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    [Route("api/Publishing")]
    public class PublishingController : Controller
    {
        private readonly PublishingClient.IPublishingService _publishingService;
        private readonly Receiver _receiver;
        private readonly IMemberService _memberService;
        private readonly TokenManagerServiceSettings _tokenManagerServiceSettings;

        public PublishingController(PublishingClient.IPublishingService publishingService, 
            IOptions<TokenManagerServiceSettings> tokenManagerServiceSettings, IMemberService memberService)
        {
            _tokenManagerServiceSettings = tokenManagerServiceSettings.Value;
            _publishingService = publishingService;
            _receiver = new Receiver(_tokenManagerServiceSettings.TokenManagerServiceUrl);
            _memberService = memberService;
        }

        [Authorize(Policy = "IsMember")]
        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [HttpPost("create")]
        public async Task<ActionResult> Create([FromBody] JObject data)
        {
            Ensure.Any.IsNotNull<JObject>(data);

            var itemData = data["wdmItemData"].ToObject<WdmItemModel>();
            Ensure.That(itemData.WdmSubCategoryId).IsNotNullOrEmpty();

            bool allImmediately = false;
            if (data.ContainsKey("allImmediately"))
                allImmediately = data["allImmediately"].ToObject<bool>();

            var result = await _publishingService.SavePublishing(itemData, allImmediately);
            return Ok(new Result(0, string.Empty, result));
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [HttpDelete("{wdmItem}")]
        public async Task<ActionResult> Remove(int wdmItem)
        {
            var result = await _publishingService.Remove(wdmItem);
            return Ok(new Result(result));
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [HttpGet("{publishStatusType}")]
        public async Task<ActionResult> GetPublishingList(string publishStatusType, JObject requestData)
        {
            var result = await _publishingService.GetPublishedList(publishStatusType, requestData);
            return Ok(new Result(result));
        }

        [HttpGet("item")]
        public async Task<ActionResult> GetPublished()
        {
            string tokenEmailAddress = string.Empty;
            var token = Helper.GetTokenValue(Request, out var anonymous);
            if (!anonymous)
            {
                var cmdParam = new ValidateTokenCmdParams() { Token = token };
                var cmd = new ValidateTokenCmd(_receiver, cmdParam);
                tokenEmailAddress = cmd.Execute().Result;
                if (string.IsNullOrEmpty(tokenEmailAddress))
                {
                    return BadRequest();
                }
            }
            //todo: add variant for anonymous
            var result = await _publishingService.GetPublished(-1);
            return Ok(new Result(result));
        }

        [HttpGet("item/{wdmItem}")]
        public async Task<ActionResult> GetPublished(int? wdmItem)
        {
            string tokenEmailAddress = string.Empty;
            var token = Helper.GetTokenValue(Request, out var anonymous);
            if (!anonymous)
            {
                var cmdParam = new ValidateTokenCmdParams() { Token = token };
                var cmd = new ValidateTokenCmd(_receiver, cmdParam);
                tokenEmailAddress = cmd.Execute().Result;
                if (string.IsNullOrEmpty(tokenEmailAddress))
                {
                    return BadRequest();
                }
            }
            //todo: add variant for anonymous
            var result = await _publishingService.GetPublished(wdmItem ?? -1);
            return Ok(new Result(result));
        }

        [HttpGet("item/hash/{*hash}")]
        public async Task<ActionResult> GetPublishedByHash(string hash)
        {
            string tokenEmailAddress = string.Empty;
            var token = Helper.GetTokenValue(Request, out var anonymous);
            if (!anonymous)
            {
                var cmdParam = new ValidateTokenCmdParams() { Token = token };
                var cmd = new ValidateTokenCmd(_receiver, cmdParam);
                tokenEmailAddress = cmd.Execute().Result;
                if (string.IsNullOrEmpty(tokenEmailAddress))
                {
                    return BadRequest();
                }
            }
            //todo: add variant for anonymous
            var result = await _publishingService.GetPublishedByHash(hash);
            return Ok(new Result(result));
        }
        
        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [HttpGet("log/{wdmItem}")]
        public async Task<ActionResult> GetPublishProcessingLogs(int wdmItem)
        {
            var result = await _publishingService.GetPublishProcessingLogs(wdmItem);
            return Ok(new Result(result));
        }

        [Authorize(Policy = "IsMember")]
        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [HttpPost("update")]
        public async Task<ActionResult> Update([FromBody]JObject data)
        {
            Ensure.Any.IsNotNull<JObject>(data);

            var wdmItem = data["wdmItemData"].ToObject<WdmItemModel>();
            var log = data["logData"].ToObject<WdmItemLogModel>();

            Ensure.Any.IsNotNull<WdmItemModel>(wdmItem);
            Ensure.Any.IsNotNull<WdmItemLogModel>(log);

            var token = Request.Headers["token"];
            Ensure.That(token.ToString()).IsNotNullOrEmpty();
            var cmdParam = new ValidateTokenCmdParams() { Token = token };
            var cmd = new ValidateTokenCmd(_receiver, cmdParam);
            string tokenUserIdentification = cmd.Execute().Result;
            if (string.IsNullOrEmpty(tokenUserIdentification))
            {
                return BadRequest();
            }
            //todo: check anonymous


            var memberInfo = await _memberService.GetMemberInfo(tokenUserIdentification);
            if (!string.IsNullOrEmpty(memberInfo.MemberId))
            {
                var member = memberInfo.MemberKey;
                log.LoggerId = member.ToString();
            }
            else
            {
                var employee = await _memberService.GetEmployeeInfo(tokenUserIdentification);
                if (string.IsNullOrEmpty(employee.UserId))
                    return BadRequest();

                log.LoggerId = employee.UserId;
            }

            //todo to add validation behavior the role of the member of operation
            var result = await _publishingService.Update(wdmItem, log);
            return Ok(new Result(result));
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [HttpPost("item/update")]
        public async Task<ActionResult> UpdateWdmItem([FromBody] WdmItemModel model)
        {
            var result = await _publishingService.UpdateWdmItem(model);
            return Ok(new Result
            {
                Code = !string.IsNullOrEmpty(result.errMsg) ? 500 : 0,
                Value = new { success = result.result },
                Message = result.errMsg
            });
        }
    }
}
