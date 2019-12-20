using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using TokenManager.BussinessLogic;
using TokenManagerCommon.CommandParam;

namespace TokenManager.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Route("api/[controller]")]
    public class TokenManagerController : Controller
    {
        private readonly ITokenManagerService _tokenManagerService;

        public TokenManagerController(ITokenManagerService tokenManagerService)
        {
            _tokenManagerService = tokenManagerService;
        }
        
        [HttpPost("generate")]
        public async Task<string> GenerateToken([FromBody] GenerateTokenCmdParams cmdParams)
        {
            return await _tokenManagerService.GenerateToken(cmdParams.EmailAddress, cmdParams.Parameters, cmdParams.Expire);
        }

        [HttpPost("validate")]
        public async Task<string> ValidateToken([FromBody] ValidateTokenCmdParams cmdParams)
        {
            return await _tokenManagerService.ValidateToken(cmdParams.Token);
        }

        [HttpPut()]
        public async Task<bool> UpdateToken([FromBody] UpdateTokenCmdParams cmdParams)
        {
            return await _tokenManagerService.UpdateToken(cmdParams.Token, cmdParams.Parameters, cmdParams.Expire);
        }

        [HttpPost("remove")]
        public async Task<bool> Remove([FromBody] RemoveTokenCmdParams cmdParams)
        {
            return await _tokenManagerService.RemoveToken(cmdParams.Token, cmdParams.EmailAddress);
        }

        [HttpPost("getparameters")]
        public async Task<Dictionary<string, object>> GetTokenParameters([FromBody] GetTokenParameters cmdParams)
        {
            return await _tokenManagerService.GetTokenParameters(cmdParams.Token, cmdParams.EmailAddress);
        }
    }
}
