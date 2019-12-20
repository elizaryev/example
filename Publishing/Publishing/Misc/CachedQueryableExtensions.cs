using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Apache.Ignite.Core;
using Microsoft.Azure.KeyVault.Models;
using Microsoft.EntityFrameworkCore;

namespace Publishing.Misc
{
    public static class CachedQueryableExtensions
    {
        private static IIgnite _igniteManager;
        private static string _cacheName = "published-cache-def-name";
        
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
            if (source == null)
                throw new ArgumentException(nameof(source));
            if (selector == null)
                throw new ArgumentException(nameof(selector));
            if (cacheKey == null)
                throw new ArgumentException(nameof(cacheKey));

            var cache = _igniteManager.GetOrCreateCache<TKeyType, TSource>(_cacheName);
            TSource cachedEntity = default;

            if (await cache.ContainsKeyAsync(cacheKey))
            {
                cachedEntity = await cache.GetAsync(cacheKey);
            }

            if (cachedEntity != null) return cachedEntity;

            cachedEntity = await source.FirstOrDefaultAsync(selector);
            if (cachedEntity != null)
                await cache.PutAsync(cacheKey, cachedEntity);

            return cachedEntity;
        }

        public static async Task<List<TSource>> CachedWhereAsync<TSource, TKeyType>(
            this IQueryable<TSource> source,
            Expression<Func<TSource, bool>> predicate,
            TKeyType cacheKey)
        {
            if (source == null)
                throw new ArgumentException(nameof(source));
            if (predicate == null)
                throw new ArgumentException(nameof(predicate));
            if (cacheKey == null)
                throw new ArgumentException(nameof(cacheKey));

            var cache = _igniteManager.GetOrCreateCache<TKeyType, List<TSource>>(_cacheName);
            List<TSource> cachedEntities = default;

            if (await cache.ContainsKeyAsync(cacheKey))
            {
                cachedEntities = await cache.GetAsync(cacheKey);
            }

            if (cachedEntities != null) return cachedEntities;

            cachedEntities = await source.Where(predicate).ToListAsync();
            if (cachedEntities != null)
                await cache.PutAsync(cacheKey, cachedEntities);

            return cachedEntities;
        }

        public static async Task<List<TSource>> CachedComplexCondition<TSource, TKeyType>(
            this IQueryable<TSource> source, TKeyType cacheKey)
        {
            if (source == null)
                throw new ArgumentException(nameof(source));
            if (cacheKey == null)
                throw new ArgumentException(nameof(cacheKey));

            var cache = _igniteManager.GetOrCreateCache<TKeyType, List<TSource>>(_cacheName);
            List<TSource> cachedEntities = default;

            if (await cache.ContainsKeyAsync(cacheKey))
            {
                cachedEntities = await cache.GetAsync(cacheKey);
            }

            cachedEntities = await source.ToListAsync();
            if (cachedEntities != null)
                await cache.PutAsync(cacheKey, cachedEntities);

            return cachedEntities;
        }
    }
}
