using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Member.Repository.Context
{
    public class FakeMemberContext: IMemberContext
    {
        public List<DTO.Member> TestUsers;

        public FakeMemberContext()
        {
            TestUsers = new List<DTO.Member>();
            TestUsers.Add(new DTO.Member() { EmailAddr = "alex@youprint.com.tw", HashedPswd = "aes-256-gcm:100000:18:VItFi1L/VcbDpQsYEbkqJXsJY5CKA/v+:5soty73UpG5jbh4k2qQlVnZR" });
        }

        public async Task<DTO.Member> GetMemberInfo(string emailAddr)
        {
            async Task<DTO.Member> Function()
            {
                return TestUsers.FirstOrDefault(user => user.EmailAddr.Equals(emailAddr));
            }
            return await Function();
        }
    }
}
