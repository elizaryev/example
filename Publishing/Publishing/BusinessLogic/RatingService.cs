using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using EnsureThat;
using Microsoft.EntityFrameworkCore;
using Publishing.Misc;
using Publishing.Repository;
using Publishing.Repository.Context;
using Publishing.Repository.DTO;
using PublishingCommon.Model;
using Utils.Helper;

namespace Publishing.BusinessLogic
{
    public class RatingService: IRatingService
    {
        private readonly IMapper _mapper;
        private readonly PublishingContext _publishingContext;

        public RatingService(IMapper mapper, PublishingContext publishingContext)
        {
            _mapper = mapper;
            _publishingContext = publishingContext;
        }

        public async Task<int> Save(WdmRatingModel itemData)
        {
            #region ensure block
            Ensure.Any.IsNotNull<WdmRatingModel>(itemData);
            Ensure.That(itemData.WdmItemIdOrMember).IsNotNullOrEmpty();
            #endregion ensure block

            var saveData = _mapper.Map<WdmRating>(itemData);
            var now = DateTime.Now;
            saveData.Tstamp = Helper.ConvertToTimestamp(now);

            var wdmRating = await _publishingContext.WdmRating.AddAsync(saveData);
            await _publishingContext.SaveChangesAsync();

            return wdmRating.Entity.WdmRatingKey;
        }

        public async Task<WdmRatingModel> GetRating(string rater, string appointment)
        {
            #region ensure block
            Ensure.That(rater).IsNotNullOrEmpty();
            Ensure.That(appointment).IsNotNullOrEmpty();
            #endregion ensure block

            string cacheKey = $"{Constants.CacheKeyName.WdmRating}{appointment}{rater}";
            var ratingItem = await _publishingContext.WdmRating
                .CachedFirstOrDefaultAsync(f => f.WdmItemIdOrMember == appointment && f.RaterMemberOrUniqId == rater, cacheKey);

            if(ratingItem == null)
                return new WdmRatingModel();

            var result = _mapper.Map<WdmRatingModel>(ratingItem);
            return result;
        }

        public async Task<List<WdmRatingModel>> GetRatingList(string appointment)
        {
            #region ensure block
            Ensure.That(appointment).IsNotNullOrEmpty();
            #endregion ensure block

            var ratingItemList = new List<WdmRating>();
            ratingItemList = await _publishingContext.WdmRating
                    .Where(f => f.WdmItemIdOrMember == appointment).ToListAsync();

            if(!ratingItemList.Any())
                return new List<WdmRatingModel>();

            var result = _mapper.Map<List<WdmRatingModel>>(ratingItemList);
            return result;
        }

        public async Task<bool> UpdateRating(WdmRatingModel itemData)
        {
            #region ensure block
            Ensure.That(itemData.RaterMemberOrUniqId).IsNotNullOrEmpty();
            Ensure.That(itemData.WdmItemIdOrMember).IsNotNullOrEmpty();
            #endregion ensure block

            string cacheKey = $"{Constants.CacheKeyName.WdmRating}{itemData.WdmItemIdOrMember}{itemData.RaterMemberOrUniqId}";
            var ratingItem = await _publishingContext.WdmRating
                .CachedFirstOrDefaultAsync(f => f.WdmItemIdOrMember == itemData.WdmItemIdOrMember
                                                && f.RaterMemberOrUniqId == itemData.RaterMemberOrUniqId,
                    cacheKey);
            if (ratingItem == null)
            {
                return false;
            }
            ratingItem.Rating = itemData.Rating;
            _publishingContext.WdmRating.Update(ratingItem);
            var saved = await _publishingContext.SaveChangesAsync() > 0;
            if (saved)
                if (!await CachedRepository.Update(cacheKey, ratingItem))
                {
                    Serilog.Log.Logger.Warning($"UpdateRating: Can't update cached value for key:[{cacheKey}]");
                }

            return saved;
        }
    }
}
