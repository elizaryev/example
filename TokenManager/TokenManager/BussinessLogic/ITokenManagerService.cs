using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TokenManager.BussinessLogic
{
    public interface ITokenManagerService
    {
        Task<string> GenerateToken(string emailAddress, Dictionary<string, object> parameters, DateTime? expires = null);
        Task<string> ValidateToken(string token);
        Task<bool> RemoveToken(string token, string emailAddress);
        Task<bool> UpdateToken(string token, Dictionary<string, object> parameters, DateTime expire);
        Task<Dictionary<string, object>> GetTokenParameters(string token, string emailAddress);
    }
}
