using System;
using System.Threading.Tasks;
using ApiGatewayService.Entities;
using MemberClient.Command;
using MemberClient.Receiver;
using MemberCommon.CommandParam;
using MemberCommon.Model;
using Microsoft.Extensions.Options;

namespace ApiGatewayService.BusinessLogic
{
    public class MemberService: IMemberService
    {
        private readonly Receiver _receiver;

        public MemberService(IOptions<MemberServiceSettings> memberServiceSettings)
        {
            _receiver = new Receiver(memberServiceSettings.Value.MemberServiceUrl,
                memberServiceSettings.Value.WdmMemberServiceUrl, memberServiceSettings.Value.EmployeeServiceUrl);
        }

        public async Task<bool> VerifyMember(string emailAddress, string password)
        {
            var cmdParam = new VerifyCmdParams() { emailAddress = emailAddress, password = password };
            var cmd = new VerifyCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return Convert.ToBoolean((object)result);
        }

        public async Task<MemberModel> GetMemberInfo(string emailAddress)
        {
            var cmdParam = new GetMemberInfoCmdParams() { EmailAddress = emailAddress };
            var cmd = new GetMemberInfoCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return result;
        }

        public async Task<MemberModel> GetMemberInfoByMember(int? member)
        {
            var cmdParam = new GetMemberInfoCmdParams() { Member = member };
            var cmd = new GetMemberInfoCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return result;
        }

        public async Task<WdmMemberModel> GetWdmMemberInfoByMember(int? member)
        {
            var cmdParam = new GetWdmMemberInfoCmdParams() { Member = member };
            var cmd = new GetWdmMemberInfoCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return result;
        }

        public async Task<bool> VerifyEmployee(string userId, string password)
        {
            var cmdParam = new VerifyEmplCmdParams() { userId = userId, password = password };
            var cmd = new VerifyEmplCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return Convert.ToBoolean((object)result);
        }

        public async Task<EmployeeModel> GetEmployeeInfo(string userId)
        {
            var cmdParam = new GetEmplInfoCmdParams() { UserId = userId };
            var cmd = new GetEmplInfoCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return result;
        }

        public async Task<bool> UpdateWdmMember(WdmMemberModel model)
        {
            var cmdParam = new UpdateWdmMemberCmdParams() { model = model};
            var cmd = new UpdateWdmMemberCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return Convert.ToBoolean((object)result);
        }

        public async Task<FacebookProfile> GetFacebookProfile(string accessToken, bool useFakeEmail = false)
        {
            var cmdParam = new GetFBProfileCmdParams() {AccessToken = accessToken, UseFakeEmail = useFakeEmail};
            var cmd = new GetFBProfileCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return result;

        }

        public async Task<bool> UpdateFacebookProfile(int memberKey, FacebookProfile facebookProfile)
        {
            var cmdParam = new UpdateFacebookProfileCmdParams() { MemberKey = memberKey, profile = facebookProfile};
            var cmd = new UpdateFacebookProfileCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return result;
        }

        public async Task<bool> CreateMember(MemberModel member)
        {
            var cmdParam = new  CreateMemberCmdParams() { member = member};
            var cmd = new CreateMemberCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return result;
        }

        public async Task<MemberModel> GetMemberInfoByFacebookId(string id)
        {
            var cmdParam = new GetMemberInfoByFbIdCmdParams(){FacebookId = id};
            var cmd = new GetMemberInfoByFBIdCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return result;
        }

        public async Task<string> GetFBProfileEmail(string facebookEmail, string memberEmail)
        {
            var cmdParam = new GetFBProfileEmailCmdParams(){ FacebookEmail = facebookEmail, MemberEmail = memberEmail};
            var cmd = new GetFBProfileEmailCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return result.Replace("\"", "");
        }

        public async Task<bool> UpdateGoogleProfile(int memberKey, GoogleProfile googleProfile)
        {
            var cmdParam = new UpdateGoogleProfileCmdParams() { MemberKey = memberKey, Profile = googleProfile };
            var cmd = new UpdateGoogleProfileCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return result;
        }

        public async Task<bool> VerifyGoogleToken(string token, string openId)
        {
            var cmdParam = new VerifyGoogleTokenCmdParams() { Token = token, OpenId = openId};
            var cmd = new VerifyGoogleTokenCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return result;
        }

        public async Task<GoogleProfile> GetGoogleProfile(string token, string openId)
        {
            var cmdParam = new GetGoogleProfileCmdParams() { Token = token, OpenId = openId };
            var cmd = new GetGoogleProfileCmd(_receiver, cmdParam);

            var result = await cmd.Execute();
            return result;
        }
    }
}
