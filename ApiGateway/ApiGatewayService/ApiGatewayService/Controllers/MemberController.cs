using System.Threading.Tasks;
using ApiGatewayCommon;
using ApiGatewayService.BusinessLogic;
using ApiGatewayService.Entities;
using ApiGatewayService.Middleware;
using ApiGatewayService.Misc;
using EnsureThat;
using MemberCommon.Model;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using TokenManagerClient.Command;
using TokenManagerClient.Receiver;
using TokenManagerCommon.CommandParam;

namespace ApiGatewayService.Controllers
{   
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    public class MemberController : Controller
    {
        private readonly Receiver _receiver;
        private readonly IMemberService _memberService;

        public MemberController(IOptions<TokenManagerServiceSettings> tokenManagerServiceSettings, IMemberService memberService)
        {
            _receiver = new Receiver(tokenManagerServiceSettings.Value.TokenManagerServiceUrl);
            _memberService = memberService;
        }

        [Route("api/member/create")]
        [HttpPost()]
        public async Task<ActionResult> CreateMember([FromBody] JObject data)
        {
            Ensure.Any.IsNotNull<JObject>(data);

            var email = data["email"].ToObject<string>();
            var pass = data["pass"].ToObject<string>();
            var name = data["name"].ToObject<string>();
            var gender = data["gender"].ToObject<string>();

            Ensure.That(email).IsNotNullOrEmpty();
            Ensure.That(pass).IsNotNullOrEmpty();
            Ensure.That(name).IsNotNullOrEmpty();

            var newMember = new MemberModel();
            newMember.EmailAddr = email;
            newMember.MemberPswd = pass;
            newMember.MemberNickName = name;
            newMember.FirstName = name;
            newMember.Surname = gender;

            var created = await _memberService.CreateMember(newMember);
            return Ok(new Result(created));
        }

        // GET: api/Member/5
        [Route("api/member")]
        [HttpGet("{member:int}")]
        public async Task<ActionResult> GetMemberInfo(int? member)
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

            if (member != null)
            {
                var result = await _memberService.GetMemberInfoByMember(member);
                if (anonymous)
                {
                    return Ok(new Result(new
                    {
                        result.MemberKey,
                        result.EmailAddr,
                        result.MemberNickName,
                        result.DateMember,
                        result.ProfileHtml
                    }));
                }
                return Ok(new Result(result));
            }
            // my cloud
            else
            {
                var result = await _memberService.GetMemberInfo(tokenEmailAddress);
                if (anonymous)
                {
                    return Ok(new Result(new
                    {
                        result.MemberKey,
                        result.EmailAddr,
                        result.MemberNickName,
                        result.DateMember,
                        result.ProfileHtml
                    }));
                }
                return Ok(new Result(result));
            }
        }
        
        [Route("api/wdmmember")]
        [HttpGet("{member}")]
        public async Task<ActionResult> GetWdmMemberInfo(int? member)
        {
            var token = Helper.GetTokenValue(Request, out var anonymous);
            if (!anonymous)
            {
                var cmdParam = new ValidateTokenCmdParams() { Token = token };
                var cmd = new ValidateTokenCmd(_receiver, cmdParam);
                string tokenEmailAddress = cmd.Execute().Result;
                if (string.IsNullOrEmpty(tokenEmailAddress))
                {
                    return BadRequest();
                }
            }

            if (member != null)
            {
                var result = await _memberService.GetWdmMemberInfoByMember(member);
                return Ok(new Result(result));
            }

            return BadRequest();
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [Route("api/wdmmember/update")]
        [HttpPost()]
        public async Task<ActionResult> UpdateWdmMember([FromBody] WdmMemberModel model)
        {
            var result = await _memberService.UpdateWdmMember(model);
            return Ok(new Result(result));
        }

        [MiddlewareFilter(typeof(AuthenticationPipeline))]
        [Route("api/employee")]
        [HttpGet("{userid}")]
        public async Task<ActionResult> GetEmployeeInfo(string userId)
        {
            if (userId != null)
            {
                var result = await _memberService.GetEmployeeInfo(userId);
                return Ok(new Result(result));
            }
            // my cloud
            else
            {
                var token = Request.Headers["token"];
                Ensure.That(token.ToString()).IsNotNullOrEmpty();

                var cmdParam = new ValidateTokenCmdParams() { Token = token };
                var cmd = new ValidateTokenCmd(_receiver, cmdParam);
                string tokenUserId = cmd.Execute().Result;
                if (string.IsNullOrEmpty(tokenUserId))
                {
                    return BadRequest();
                }

                var result = await _memberService.GetEmployeeInfo(tokenUserId);
                return Ok(new Result(result));
            }
        }
    }
}
