using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Apache.Ignite.Core;

namespace Member.Repository
{
    public static class CachedRepository 
    {
        private static IIgnite _igniteManager;
        private static string _cacheName = "member-cache-def-name";

        public static void Init(IgniteConfiguration ic)
        {
            try
            {
                _igniteManager = Ignition.TryGetIgnite() ?? Ignition.Start(ic);
                if (_igniteManager == null)
                {
                    Serilog.Log.Logger.Warning("Can't started Ignite service!");
                }
                else
                {
                    if (ic?.CacheConfiguration.FirstOrDefault() != null)
                    {
                        _cacheName = ic.CacheConfiguration.FirstOrDefault()?.Name;
                    }
                }
            }
            catch (Exception e)
            {
                Serilog.Log.Logger.Error(e, string.Empty);
                throw;
            }
        }

        public static async Task<bool> Update<TSource, TKey>(TKey key, TSource newVal)
        {
            var cache = _igniteManager.GetOrCreateCache<TKey, TSource>(_cacheName);
            return await cache.ReplaceAsync(key, newVal);
        }

        public static async Task<bool> UpdateAll<TSource, TKey>(List<TKey> keys, TSource newVal)
        {
            bool success = true;
            var cache = _igniteManager.GetOrCreateCache<TKey, TSource>(_cacheName);
            foreach(TKey key in keys)
            {
                if (!await cache.ReplaceAsync(key, newVal))
                    success = false;
            };
            return success;
        }
    }
}
