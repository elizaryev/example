using System.Threading.Tasks;
using MemberCommon.Model;

namespace Member.BusinessLogic
{
    public interface IMemberService
    {
        Task<bool> UpdateCacheMemberbyKey(int memberKey);
        Task<MemberModel> GetMemberInfo(string emailAddress);
        Task<MemberModel> GetMemberInfo(int? member);
        Task<MemberModel> GetMemberInfoByFacebookId(string id);
        Task<WdmMemberModel> GetWdmMemberInfo(int? wdmMember);
        Task<WdmMemberModel> GetWdmMemberInfoByMember(int? member);
        Task<bool> VerifyPass(string emailAddress, string password);
        Task<bool> VerifyEmployeePass(string userId, string password);
        Task<EmployeeModel> GetEmployeeInfo(string userId);
        Task<bool> UpdateWdmMember(WdmMemberModel model);
        Task<FacebookProfile> GetFacebookProfile(string accessToken, bool useFakeEmail);
        Task<bool> UpdateFacebookProfile(int memberKey, FacebookProfile facebookProfile);
        Task<bool> CreateMember(MemberModel member);
        string GetFBProfileEmail(string facebookEmail, string memberEmail);
        Task<bool> UpdateGoogleProfile(int memberKey, GoogleProfile googleProfile);
        Task<GoogleProfile> GetGoogleProfile(string token, string openId);
        Task<bool> VerifyGoogleToken(string token, string openId);
    }
}
