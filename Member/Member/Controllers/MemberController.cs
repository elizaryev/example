using System.Threading.Tasks;
using EnsureThat;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Member.BusinessLogic;
using MemberCommon.CommandParam;
using MemberCommon.Model;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Member.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class MemberController : Controller
    {
        private readonly IMemberService _memberService;

        public MemberController(IMemberService memberService)
        {
            _memberService = memberService;
        }

        [Route("updatemembercache/{memberKey}")]
        [HttpPost]
        public async Task<bool> UpdateCacheMemberbyKey(int memberKey)
        {
            return await _memberService.UpdateCacheMemberbyKey(memberKey);
        }

        [HttpPost("create")]
        public async Task<bool> CreateMember([FromBody] JObject data)
        {
            var parameters = JsonConvert.DeserializeObject<CreateMemberCmdParams>(data.ToString());
            return await _memberService.CreateMember(parameters.member);
        }

        [HttpGet]
        public async Task<MemberModel> GetMemberInfoByWdmMember([FromQuery] string emailAddress, [FromQuery] int? member)
        {
            if(!string.IsNullOrEmpty(emailAddress))
                return await _memberService.GetMemberInfo(emailAddress);
            if(member != null)
                return await _memberService.GetMemberInfo(member);

            return new MemberModel();
        }

        [Route("verify")]
        [HttpPost] 
        public async Task<bool> VerifyPass([FromBody] VerifyCmdParams userModel)
        {
            return await _memberService.VerifyPass(userModel.emailAddress, userModel.password);
        }

        #region facebook

        [HttpGet("facebook")]
        public async Task<MemberModel> GetMemberInfoByFacebookId([FromQuery] string id)
        {
            return await _memberService.GetMemberInfoByFacebookId(id);
        }

        [HttpPost("facebook/profile/update")]
        public async Task<bool> UpdateFacebookProfile([FromBody] JObject data)
        {
            var parameters = JsonConvert.DeserializeObject<UpdateFacebookProfileCmdParams>(data.ToString());
            return await _memberService.UpdateFacebookProfile(parameters.MemberKey, parameters.profile);
        }

        [HttpPost("facebook/profile")]
        public async Task<FacebookProfile> GetFacebookProfile([FromBody] GetFBProfileCmdParams parameters)
        {
            return await _memberService.GetFacebookProfile(parameters.AccessToken, parameters.UseFakeEmail);
        }

        [HttpPost("facebook/profile/email")]
        public string GetFBProfileEmail([FromBody] GetFBProfileEmailCmdParams parameters)
        {
            return _memberService.GetFBProfileEmail(parameters.FacebookEmail, parameters.MemberEmail);
        }

        #endregion facebook

        #region google

        [HttpPost("google/profile/update")]
        public async Task<bool> UpdateGoogleProfile([FromBody] JObject data)
        {
            var parameters = JsonConvert.DeserializeObject<UpdateGoogleProfileCmdParams>(data.ToString());
            return await _memberService.UpdateGoogleProfile(parameters.MemberKey, parameters.Profile);
        }

        [HttpPost("google/profile")]
        public async Task<GoogleProfile> GetGoogleProfile([FromBody] GetGoogleProfileCmdParams parameters)
        {
            return await _memberService.GetGoogleProfile(parameters.Token, parameters.OpenId);
        }

        [HttpPost("google/verify")]
        public async Task<bool> VerifyGoogleToken([FromBody] VerifyGoogleTokenCmdParams parameters)
        {
            return await _memberService.VerifyGoogleToken(parameters.Token, parameters.OpenId);
        }

        #endregion google
    }
}
