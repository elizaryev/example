using System.Threading.Tasks;
using ApiGatewayCommon;
using ApiGatewayService.Entities;
using ApiGatewayService.Middleware;
using ApiGatewayService.Misc;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using PublishingCommon.Model;
using TokenManagerClient.Command;
using TokenManagerClient.Receiver;
using TokenManagerCommon.CommandParam;

namespace ApiGatewayService.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    [Route("api/Rating")]
    public class RatingController : Controller
    {
        private readonly PublishingClient.IRatingService _ratingService;
        private readonly Receiver _receiver;

        public RatingController(PublishingClient.IRatingService ratingService, IOptions<TokenManagerServiceSettings> tokenManagerServiceSettings)
        {
            _ratingService = ratingService;
            _receiver = new Receiver(tokenManagerServiceSettings.Value.TokenManagerServiceUrl);
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [HttpPost("create")]
        public async Task<ActionResult> Create([FromBody] WdmRatingModel ratingData)
        {
            ratingData.Ip = Helper.GetRequestIP(HttpContext);
            var result = await _ratingService.Save(ratingData);
            return Ok(new Result(result)); 
        }

        [HttpGet("{appointment}/{rater}")]
        public async Task<ActionResult> GetRating(string appointment, string rater)
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

            var result = await _ratingService.GetRating(rater, appointment);
            if (anonymous)
            {
                return Ok(new Result(new
                {
                    result.WdmRatingKey,
                    result.RateAgainst,
                    result.WdmItemIdOrMember,
                    result.Rating,
                    result.RaterMemberOrUniqId
                }));
            }
            return Ok(new Result(result));
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [HttpPost]
        public async Task<ActionResult> UpdateRating([FromBody] WdmRatingModel ratingData)
        {
            ratingData.Ip = Helper.GetRequestIP(HttpContext);
            var result = await _ratingService.UpdateRating(ratingData);
            return Ok(new Result(result));
        }
    }
}
