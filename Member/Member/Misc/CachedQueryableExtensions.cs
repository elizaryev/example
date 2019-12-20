using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Apache.Ignite.Core;
using Microsoft.EntityFrameworkCore;

namespace Member.Misc
{
    public static class CachedQueryableExtensions
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

        public static async Task<TSource> CachedFirstOrDefaultAsync<TSource, TKeyType>(
            this IQueryable<TSource> source,
            Expression<Func<TSource, bool>> selector,
            TKeyType cacheKey)
        {

            var cache = _igniteManager.GetOrCreateCache<TKeyType, TSource>(_cacheName);
            TSource cachedEntity = default;

            if (await cache.ContainsKeyAsync(cacheKey))
            {
                cachedEntity = await cache.GetAsync(cacheKey);
                //Serilog.Log.Logger.Information($"GET CACHED VALUE FOR:{cacheKey}");
            }

            if (cachedEntity != null) return cachedEntity;

            cachedEntity = await source.FirstOrDefaultAsync(selector);
            if (cachedEntity != null)
                await cache.PutAsync(cacheKey, cachedEntity);

            return cachedEntity;
        }
    }
}
