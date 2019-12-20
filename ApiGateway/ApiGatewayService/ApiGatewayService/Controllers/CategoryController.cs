using System.Threading.Tasks;
using ApiGatewayCommon;
using ApiGatewayService.BusinessLogic;
using ApiGatewayService.Entities;
using ApiGatewayService.Middleware;
using EnsureThat;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using PublishingCommon.Model;
using TokenManagerClient.Command;
using TokenManagerClient.Receiver;
using TokenManagerCommon.CommandParam;
using ICategorySevice = PublishingClient.ICategorySevice;

namespace ApiGatewayService.Controllers
{
    [MiddlewareFilter(typeof(AuthenticationPipeline))]
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    [Route("api/Category")]
    public class CategoryController : Controller
    {
        private readonly PublishingClient.ICategorySevice _categorySevice;

        public CategoryController(PublishingClient.ICategorySevice categorySevice)
        {
            _categorySevice = categorySevice;
        }

        // GET: api/Category
        [HttpGet]
        public async Task<ActionResult> Get()
        {
            var result = await _categorySevice.GetCategoryList();
            return Ok(new Result(result));
        }
    }

    [MiddlewareFilter(typeof(AuthenticationPipeline))]
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    [Route("api/subcategory")]
    public class SubcategoryController : Controller
    {
        private readonly PublishingClient.ICategorySevice _categorySevice;
        private readonly Receiver _receiver;
        private readonly IMemberService _memberService;

        public SubcategoryController(PublishingClient.ICategorySevice categorySevice, 
            IOptions<TokenManagerServiceSettings> tokenManagerServiceSettings, IMemberService memberService)
        {
            _categorySevice = categorySevice;
            _receiver = new Receiver(tokenManagerServiceSettings.Value.TokenManagerServiceUrl);
            _memberService = memberService;
        }

        [HttpGet]
        public async Task<ActionResult> Get([FromQuery]string wdmCategoryId)
        {
            Ensure.That(wdmCategoryId).IsNotNullOrEmpty();
            var result = await _categorySevice.GetSubCategoryList(wdmCategoryId);
            return Ok(new Result(result));
        }

        [HttpPost("create")]
        public async Task<ActionResult> Create([FromBody] WdmSubCategoryModel subcategory)
        {
            Ensure.Any.IsNotNull<WdmSubCategoryModel>(subcategory);

            var token = Request.Headers["token"];
            Ensure.That(token.ToString()).IsNotNullOrEmpty();
            var cmdParam = new ValidateTokenCmdParams() { Token = token };
            var cmd = new ValidateTokenCmd(_receiver, cmdParam);
            string tokenEmailAddress = cmd.Execute().Result;
            if (string.IsNullOrEmpty(tokenEmailAddress))
            {
                return BadRequest();
            }

            var memberInfo = await _memberService.GetMemberInfo(tokenEmailAddress);
            var member = memberInfo.MemberKey;

            subcategory.CreatorUserId = tokenEmailAddress;
            subcategory.CreatorMember = member;

            var result = await _categorySevice.SaveSubCategory(subcategory);
            return Ok(new Result(0, string.Empty, result));
        }
    }
}
