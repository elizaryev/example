using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ApiGatewayCommon;
using ApiGatewayService.BusinessLogic;
using ApiGatewayService.Entities;
using ApiGatewayService.Middleware;
using ApiGatewayService.Misc;
using ApiGatewayService.Model;
using EnsureThat;
using MemberCommon.CommandParam;
using MemberCommon.Model;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using Serilog;
using TokenManagerClient.Command;
using TokenManagerCommon;
using TokenManagerCommon.CommandParam;

namespace ApiGatewayService.Controllers
{
    [Produces("application/json")]
    [EnableCors("AllowSpecificOrigin")]
    [Route("api/[controller]")]
    public class GatewayController : Controller
    {
        private readonly IGatewayService _gatewayService;
        private readonly IMemberService _memberService;
        private readonly int _YPMinDefaultMinutesSessionTimeout;
        private readonly TokenManagerServiceSettings _tokenManagerServiceSettings;

        public GatewayController(IGatewayService gatewayService, IMemberService memberService,
            IOptions<TokenManagerServiceSettings> tokenManagerServiceSettings)
        {
            _gatewayService = gatewayService;
            _memberService = memberService;
            _tokenManagerServiceSettings = tokenManagerServiceSettings.Value;

            if (!int.TryParse(_tokenManagerServiceSettings.YPMinDefaultMinutesSessionTimeout,
                out _YPMinDefaultMinutesSessionTimeout) || _YPMinDefaultMinutesSessionTimeout == 0)
            {
                _YPMinDefaultMinutesSessionTimeout = 40; // by default set 40 minutes if some error when parse config value
            }
        }

        [HttpGet("validatetoken")]
        public async Task<ActionResult> ValidateToken([FromQuery] string token)
        {
            Ensure.That(token).IsNotNullOrEmpty();

            var result = await _gatewayService.ValidateToken(token);
            return Ok(new Result(result));
        }

        [HttpGet("anonymous")]
        public async Task<ActionResult> IsAnonymousUser([FromQuery] string token)
        {
            Ensure.That(token).IsNotNullOrEmpty();

            var result = await _gatewayService.IsAnonymousUser(token);
            return Ok(new Result(result));
        }

        [HttpPost("login")]
        public async Task<ActionResult> LoginByCartOrderId([FromBody]JObject data)
        {
            Ensure.Any.IsNotNull<JObject>(data);
            var token = await _gatewayService.GetTokenByLoginParameters(data, _YPMinDefaultMinutesSessionTimeout);
            return Ok(new Result(token));
        }

        [HttpPost("fbsignup")]
        public async Task<ActionResult> SignUpByFacebookAccessToken([FromBody] JObject data)
        {
            var token = Helper.GetTokenValue(Request, out var anonymous);
            if (anonymous)
            {
                NotFound(new Result(1, "The access token not found."));
            }

            Ensure.That(token.ToString()).IsNotNullOrEmpty();
            Ensure.Any.IsNotNull<JObject>(data);
            GetFBProfileCmdParams fbModel;
            try
            {
                fbModel = data["fbModel"].ToObject<GetFBProfileCmdParams>();
                Ensure.That(fbModel.AccessToken).IsNotNullOrEmpty();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "");
                return BadRequest();
            }

            var resultSignup = await _gatewayService.SignUpByFacebookAccessToken(token, fbModel.AccessToken);
            if (resultSignup.Code == 204)
                return NotFound(resultSignup);
            if (resultSignup.Code == 500)
                return StatusCode(500, resultSignup);

            return Ok(resultSignup);
        }
        
        [HttpPost("fblogin")]
        public async Task<ActionResult> LoginByFacebookAccessToken([FromBody] JObject data)
        {
            Ensure.Any.IsNotNull<JObject>(data);

            string email = string.Empty;
            var loginParameters = Helper.GetLoginParameters(data);
            GetFBProfileCmdParams fbModel;
            try
            {
                fbModel = data["fbModel"].ToObject<GetFBProfileCmdParams>();
                Ensure.That(fbModel.AccessToken).IsNotNullOrEmpty();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "");
                return BadRequest();
            }

            var fbProfile = await _memberService.GetFacebookProfile(fbModel.AccessToken, true);
            if (fbProfile == null || (string.IsNullOrEmpty(fbProfile.Email) && string.IsNullOrEmpty(fbProfile.Id)))
            {
                return NotFound(new Result(1, $"The fb account for access token:[{fbModel.AccessToken}] not found."));
            }

            MemberModel member = await _memberService.GetMemberInfoByFacebookId(fbProfile.Id);
            // if member already exists. Just update Facebook columns
            if (!string.IsNullOrEmpty(member.MemberId))
            {
                var updatedFbProfile = await _memberService.UpdateFacebookProfile(member.MemberKey, fbProfile);
                if (!updatedFbProfile)
                {
                    Log.Warning($"Unable to update Facebook profile for member:[{member.MemberKey}]");
                }
               
                email = await _memberService.GetFBProfileEmail(fbProfile.Email, member.EmailAddr);
            }
            else
            {
                var newMember = _gatewayService.InitFacebookNewMember(fbProfile);
                var created = await _memberService.CreateMember(newMember);
                if (!created)
                {
                    return StatusCode(500, $"Unable to create new member for Facebook account:[{fbProfile.Email}]");
                }

                member = await _memberService.GetMemberInfo(fbProfile.Email);
                var updatedFbProfile = await _memberService.UpdateFacebookProfile(member.MemberKey, fbProfile);
                if (!updatedFbProfile)
                {
                    Log.Warning($"Unable to update Facebook profile for new member:[{member.MemberKey}]");
                }

                email = fbProfile.Email;
            }

            var loginDict = Helper.GetLoginDict(data);

            var expire = loginParameters.RememberMe
                ? DateTime.Now.AddYears(100) // emulation of the 1st century to the timestamp of the expiration
                : DateTime.Now.AddMinutes(loginParameters.YPSessionTimeout == 0
                    ? _YPMinDefaultMinutesSessionTimeout
                    : loginParameters.YPSessionTimeout); // usage YP timeout

            var token = await _gatewayService.GenerateToken(email, loginDict, expire); 

            // SignIn to the YP site too
            if (!string.IsNullOrEmpty(loginParameters.CartOrderId))
            {
                bool loggedToYP = await _gatewayService.LoginOnYPSite(loginParameters, member);
                if (!loggedToYP)
                {
                    Log.Warning($"Unable to login in the YP site for new member:[{member.MemberKey}]");
                }
            }

            return Ok(new Result(token));
        }

        [Route("member")]
        [HttpPost]
        public async Task<ActionResult> Login([FromBody] JObject data)
        {
            Ensure.Any.IsNotNull<JObject>(data);

            var userModel = new VerifyCmdParams();
            try
            {
                userModel = data["userModel"].ToObject<VerifyCmdParams>();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "");
                return BadRequest();
            }
            var loginParameters = Helper.GetLoginParameters(data);
            var expire = loginParameters.RememberMe
                ? DateTime.Now.AddYears(100) // emulation of the 1st century to the timestamp of the expiration
                : DateTime.Now.AddMinutes(loginParameters.YPSessionTimeout == 0
                    ? _YPMinDefaultMinutesSessionTimeout
                    : loginParameters.YPSessionTimeout); // usage YP timeout
            var loginDict = Helper.GetLoginDict(data);

            var user = new MemberModel();
            string userIdentification = string.Empty;
            //anonymous variant
            if (string.IsNullOrEmpty(userModel.emailAddress) )
            {
                //if emailaddress empty - then generation token for anonymous user
                var anonymousName = $"{Guid.NewGuid().ToString()}-{Constants.AnonymousKeyName}";
                userIdentification = anonymousName;
                // mark token as anonymous
                loginDict.Add(Constants.AnonymousKeyName, true);
            }
            else
            {
                user = await _memberService.GetMemberInfo(userModel.emailAddress);
                if(string.IsNullOrEmpty(user.MemberId) || string.IsNullOrEmpty(user.EmailAddr))
                {
                    return NotFound(new Result(1, "The user was not found."));
                }

                bool credentials = await _memberService.VerifyMember(userModel.emailAddress, userModel.password);
                if (!credentials)
                    return Forbid();

                userIdentification = user.EmailAddr;
            }

            var token = await _gatewayService.GenerateToken(userIdentification, loginDict, expire);
            try
            {
                if (!string.IsNullOrEmpty(user.MemberId) && !string.IsNullOrEmpty(user.EmailAddr))
                    if (!string.IsNullOrEmpty(token) &&
                        !await _gatewayService.LoginOnYPSite(loginParameters, user))
                    {
                        Log.Warning(
                            $"Can't do a login operation on YP site for cartOrderId:[{loginParameters.CartOrderId}] and member:[{userModel.emailAddress}] ");
                    }
            }
            catch (Exception ex)
            {
                Log.Error(ex, "");
            }

            return Ok(new Result(token));
        }

        [Route("employee")]
        [HttpPost]
        public async Task<ActionResult> LoginEmployee([FromBody]VerifyEmplCmdParams model)
        {
            //todo: need implement in future
            return BadRequest();
            //Ensure.Any.IsNotNull<VerifyEmplCmdParams>(model);

            //var user = await _memberService.GetEmployeeInfo(model.userId);
            //if (user == null)
            //    return NotFound(new Result(1, "The employee was not found."));

            //bool credentials = await _memberService.VerifyEmployee(model.userId, model.password);
            //if (!credentials)
            //    return Forbid();

            //var token = await _gatewayService.GenerateToken(user.UserId, (DateTime?)null);
            //return Ok(new Result(token));
        }

        [HttpPost("removetoken")]
        public async Task<ActionResult> RemoveToken([FromBody] JObject data)
        {
            Ensure.Any.IsNotNull<JObject>(data);
           
            var token = data["token"].ToObject<string>();
            if(string.IsNullOrEmpty(token))
                return BadRequest();

            var result = await _gatewayService.RemoveToken(token, new LoginParameters());
            return Ok(new Result(result));
        }

        [HttpPost("logout")]
        public async Task<ActionResult> LogOut([FromBody] LoginParameters parameters)
        {
            if (parameters == null)
                return BadRequest();

            bool result = false;
            // remove by token (witweb site)
            var token = Helper.GetTokenValue(Request, out var anonymous);
            if (!anonymous)
            {
                result = await _gatewayService.RemoveToken(token, parameters);
                if(result)
                    return Ok(new Result(result));
            }
            
            // try remove by email address of member (YP site)
            var member = await _gatewayService.GetMemberInfoByLoginParameters(parameters);
            if (member != null)
            {
                result = await _gatewayService.RemoveTokenByEmailAddress(member.EmailAddr);
                return Ok(new Result(result));
            }

            return NotFound(new Result(false));
        }

        [HttpPost("google/login")]
        public async Task<ActionResult> LoginByGoogleAccessToken([FromBody] JObject data)
        {
            Ensure.Any.IsNotNull<JObject>(data);
            GetGoogleProfileCmdParams googleModel;
            try
            {
                googleModel = data["fbModel"].ToObject<GetGoogleProfileCmdParams>();
                Ensure.That(googleModel.Token).IsNotNullOrEmpty();
                Ensure.That(googleModel.OpenId).IsNotNullOrEmpty();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "");
                return BadRequest();
            }
            var loginParameters = Helper.GetLoginParameters(data);
            var loginDict = Helper.GetLoginDict(data);

            var resultSignup = await _gatewayService.LoginByGoogleAccessToken(googleModel.Token, googleModel.OpenId, loginParameters, loginDict);
            if (resultSignup.Code == 204)
                return NotFound(resultSignup);
            if (resultSignup.Code == 500)
                return StatusCode(500, resultSignup);

            return Ok(resultSignup);
        }

        [HttpPost("getparameters")]
        public async Task<ActionResult> GetTokenParameters([FromBody] LoginParameters parameters)
        {
            if (parameters == null)
                return BadRequest();

            var result = new Dictionary<string, object>();
            // get by token
            var token = Helper.GetTokenValue(Request, out var anonymous);
            if (!anonymous)
            {
                result = await _gatewayService.GetTokenParameters(token, "");
                return Ok(new Result(result));
            }

            var member = await _gatewayService.GetMemberInfoByLoginParameters(parameters);
            if (member != null)
            {
                result = await _gatewayService.GetTokenParameters("", member.EmailAddr);
                return Ok(new Result(result));
            }

            return NotFound(new Result(result));
        }
    }
}
