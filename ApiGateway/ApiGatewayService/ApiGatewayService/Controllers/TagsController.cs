using System.Collections.Generic;
using System.Threading.Tasks;
using ApiGatewayCommon;
using ApiGatewayService.Entities;
using ApiGatewayService.Middleware;
using ApiGatewayService.Misc;
using EnsureThat;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Tag.Model;
using TokenManagerClient.Command;
using TokenManagerClient.Receiver;
using TokenManagerCommon.CommandParam;

namespace ApiGatewayService.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    [Route("api/Tags")]
    public class TagsController : Controller
    {
        private readonly TagClient.ITagService _tagItemService;
        private readonly Receiver _receiver;

        public TagsController(TagClient.ITagService tagItemService, IOptions<TokenManagerServiceSettings> tokenManagerServiceSettings)
        {
            _tagItemService = tagItemService;
            _receiver = new Receiver(tokenManagerServiceSettings.Value.TokenManagerServiceUrl);
        }

        [HttpGet]
        public async Task<ActionResult> Get()
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
            var result = await _tagItemService.GetAllTags();
            return Ok(new Result(result));
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [HttpPut]
        public async Task<ActionResult> Put([FromBody]List<TagItem> tagItemList)
        {
            Ensure.Any.IsNotNull<List<TagItem>>(tagItemList);

            var result = await _tagItemService.SaveTagList(tagItemList);
            return Ok(new Result(result));
        }
    }
}
