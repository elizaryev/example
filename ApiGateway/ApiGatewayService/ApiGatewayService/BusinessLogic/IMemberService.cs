using System.Threading.Tasks;
using MemberCommon.Model;

namespace ApiGatewayService.BusinessLogic
{
    public interface IMemberService
    {
        Task<bool> VerifyMember(string emailAddress, string password);
        Task<MemberModel> GetMemberInfo(string emailAddress);
        Task<MemberModel> GetMemberInfoByMember(int? member);
        Task<WdmMemberModel> GetWdmMemberInfoByMember(int? member);

        Task<bool> VerifyEmployee(string userId, string password);
        Task<EmployeeModel> GetEmployeeInfo(string userId);
        Task<bool> UpdateWdmMember(WdmMemberModel model);

        Task<FacebookProfile> GetFacebookProfile(string accessToken, bool useFakeEmail = false);
        Task<bool> UpdateFacebookProfile(int memberKey, FacebookProfile facebookProfile);
        Task<bool> CreateMember(MemberModel member);
        Task<MemberModel> GetMemberInfoByFacebookId(string id);
        Task<string> GetFBProfileEmail(string facebookEmail, string memberEmail);

        Task<bool> UpdateGoogleProfile(int memberKey, GoogleProfile googleProfile);
        Task<GoogleProfile> GetGoogleProfile(string token, string openId);
        Task<bool> VerifyGoogleToken(string token, string openId);
    }
}