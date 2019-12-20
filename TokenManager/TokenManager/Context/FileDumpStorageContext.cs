using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Serilog;
using TokenManager.Entities;

namespace TokenManager.Context
{
    public class FileDumpStorageContext: IDumpStorageContext
    {
        private string _defaultDumpFile = "tokenDump.dmp";
        private string _defaultDumpFolder = Directory.GetCurrentDirectory();
        private readonly TokenManagerServiceSettings _tokenManagerSettings;
        public FileDumpStorageContext(IOptions<TokenManagerServiceSettings> tokenManagerSettings)
        {
            _tokenManagerSettings = tokenManagerSettings.Value;
        }

        public ConcurrentDictionary<string, Dictionary<string, object>> Load()
        {
            try
            {
                string dumpFolder =
                    (string.IsNullOrEmpty(_tokenManagerSettings.DumpFolder) ||
                     !Directory.Exists(_tokenManagerSettings.DumpFolder))
                        ? _defaultDumpFolder
                        : _tokenManagerSettings.DumpFolder;

                string dumpFile = (string.IsNullOrEmpty(_tokenManagerSettings.DumpFile))
                    ? _defaultDumpFile
                    : _tokenManagerSettings.DumpFile;

                string dumpFilePath = Path.Combine(dumpFolder, dumpFile);
                if (!File.Exists(dumpFilePath))
                {
                    using (var newDumpFileStream = File.Create(dumpFilePath))
                    {
                        newDumpFileStream.Flush();
                    }
                }

                string fileData;
                using (var fileStream = new FileStream(dumpFilePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                {
                    using (var reader = new StreamReader(fileStream))
                    {
                        fileData = reader.ReadToEnd();
                    }
                }

                if (string.IsNullOrEmpty(fileData))
                    return new ConcurrentDictionary<string, Dictionary<string, object>>();

                var dumpData = JsonConvert.DeserializeObject<ConcurrentDictionary<string, Dictionary<string, object>>>(fileData);
                var expiredData = dumpData.Where(w =>
                {
                    var expirationTime = ((DateTime?) w.Value["expires"]);
                    if (expirationTime.HasValue)
                    {
                        TimeSpan tsNow = new TimeSpan(DateTime.Now.Ticks);
                        TimeSpan tsExpire = new TimeSpan(expirationTime.Value.Ticks);
                        if (tsNow.TotalMilliseconds > tsExpire.TotalMilliseconds)
                        {
                            return true;
                        }
                    }
                    return false;
                });

                foreach (var item in expiredData)
                {
                    dumpData.TryRemove(item.Key, out var removedItem);
                }
                return dumpData;
            }
            catch (Exception e)
            {
                Log.Error(e, "");
                return new ConcurrentDictionary<string, Dictionary<string, object>>();
            }
        }

        public async Task<bool> Update(ConcurrentDictionary<string, Dictionary<string, object>> dumpInfo)
        {
            try
            {
                string fileDump = Path.Combine(_tokenManagerSettings.DumpFolder, _tokenManagerSettings.DumpFile);
                var dumpData = JsonConvert.SerializeObject(dumpInfo);

                using (var fileStream = new FileStream(fileDump, FileMode.Truncate, FileAccess.Write, FileShare.ReadWrite))
                {
                    using (var reader = new StreamWriter(fileStream))
                    {
                        await reader.WriteLineAsync(dumpData);
                    }
                }

                return true;
            }
            catch (Exception e)
            {
                Log.Error(e, "");
                return false;
            }
        }
    }
}
