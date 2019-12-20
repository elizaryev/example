using System.Threading.Tasks;
using Member.BusinessLogic;
using MemberCommon.Model;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace Member.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Route("api/[controller]")]
    public class WdmMemberController : Controller
    {
        private readonly IMemberService _memberService;

        public WdmMemberController(IMemberService memberService)
        {
            _memberService = memberService;
        }
        
        [HttpGet]
        public async Task<WdmMemberModel> GetWdmMemberInfoByWdmMemberOrMember([FromQuery] int? member, [FromQuery] int? wdmMember)
        {
            if (wdmMember != null)
                return await _memberService.GetWdmMemberInfo(wdmMember);
            if (member != null)
                return await _memberService.GetWdmMemberInfoByMember(member);

            return new WdmMemberModel();
        }

        [HttpPost]
        public async Task<bool> UpdateWdmMember([FromBody] WdmMemberModel model)
        {
            return await _memberService.UpdateWdmMember(model);
        }
    }
}