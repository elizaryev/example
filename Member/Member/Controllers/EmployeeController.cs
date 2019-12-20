using System.Collections.Generic;
using System.Threading.Tasks;
using Member.BusinessLogic;
using MemberCommon.CommandParam;
using MemberCommon.Model;
using Microsoft.AspNetCore.Mvc;

namespace Member.Controllers
{
    [Produces("application/json")]
    [Route("api/[controller]")]
    public class EmployeeController : Controller
    {
        private readonly IMemberService _memberService;

        public EmployeeController(IMemberService memberService)
        {
            _memberService = memberService;
        }

        [HttpGet]
        public async Task<EmployeeModel> GetEmployeeInfo([FromQuery] string userId)
        {
            if (!string.IsNullOrEmpty(userId))
                return await _memberService.GetEmployeeInfo(userId);

            return new EmployeeModel();
        }

        [Route("verify")]
        [HttpPost]
        public async Task<bool> VerifyPass([FromBody] VerifyEmplCmdParams model)
        {
            return await _memberService.VerifyEmployeePass(model.userId, model.password);
        }
    }
}
