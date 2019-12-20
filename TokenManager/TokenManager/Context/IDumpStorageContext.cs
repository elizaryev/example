using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TokenManager.Context
{
    public interface IDumpStorageContext
    {
        ConcurrentDictionary<string, Dictionary<string, object>> Load();
        Task<bool> Update(ConcurrentDictionary<string, Dictionary<string, object>> dumpInfo);
    }
}