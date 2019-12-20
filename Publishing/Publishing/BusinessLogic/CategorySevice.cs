using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using EnsureThat;
using MemberCommon.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Publishing.Misc;
using Publishing.Repository;
using Publishing.Repository.Context;
using Publishing.Repository.DTO;
using PublishingCommon.Model;
using Utils.Helper;

namespace Publishing.BusinessLogic
{
    public class CategorySevice: ICategorySevice
    {
        private readonly PublishingContext _publishingContext;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;

        private MemberModel MemberInfo => (MemberModel)_httpContextAccessor.HttpContext.Items[
            _httpContextAccessor.HttpContext.Request.Headers["token"]];

        public CategorySevice(PublishingContext publishingContext, IMapper mapper,
            IHttpContextAccessor httpContextAccessor)
        {
            _publishingContext = publishingContext;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
        }

        public async Task<bool> ReloadCacheCategory()
        {
            var categories = await _publishingContext.WdmCategory.Where(w =>
                w.ActiveFlg == "Yes"
                && w.DeletedFlg == "No").ToListAsync();

            if (!await CachedRepository.Update(Constants.CacheKeyName.ActiveCategories, categories))
            {
                Serilog.Log.Logger.Warning($"SaveSubCategory: Not reloaded cache successfully for categories");
            }
          
            return true;
        }

        public async Task<List<WdmCategoryModel>> GetCategoryList()
        {
            var list = await _publishingContext.WdmCategory.CachedWhereAsync(
                w => w.ActiveFlg == "Yes" && w.DeletedFlg == "No", Constants.CacheKeyName.ActiveCategories);
                           
            //var list = await _publishingContext.WdmCategory.Where(w => w.ActiveFlg == "Yes" && w.DeletedFlg == "No")
            //    .OrderBy(x => x.DisplayOrder).ToListAsync();
            List<WdmCategoryModel> result = _mapper.Map<List<WdmCategoryModel>>(list.OrderBy(x => x.DisplayOrder));
            return result;
        }

        public async Task<List<WdmSubCategoryModel>> GetSubCategoryList(string wdmCategoryId)
        {
            //var list =  await _publishingContext.WdmSubCategory.Where(w =>
            //    w.WdmCategoryId == wdmCategoryId 
            //    //&& w.CreatorMember == MemberInfo.MemberKey // desabled and show all subcategory
            //    && w.ActiveFlg == "Yes" 
            //    && w.DeletedFlg == "No").ToListAsync();

            var cacheKey = $"{Constants.CacheKeyName.SubCategoryList}{wdmCategoryId}";
            var list = await _publishingContext.WdmSubCategory.CachedWhereAsync(w =>
                w.WdmCategoryId == wdmCategoryId
                && w.ActiveFlg == "Yes"
                && w.DeletedFlg == "No", cacheKey);

           List <WdmSubCategoryModel> result = _mapper.Map<List<WdmSubCategoryModel>>(list);
            return result;
        }

        public async Task<int> SaveSubCategory(WdmSubCategoryModel subcategory)
        {
            #region ensure block
            Ensure.Any.IsNotNull<WdmSubCategoryModel>(subcategory);
            #endregion ensure block

            var savingData = _mapper.Map<WdmSubCategory>(subcategory);
            var now = DateTime.Now;
            savingData.WdmCategoryId = savingData.WdmCategoryId;
            savingData.ActiveFlg = "Yes";
            savingData.DeletedFlg = "No";
            savingData.Tstamp = Helper.ConvertToTimestamp(now);
            savingData.CreatorUserId = string.Empty; // todo: remove this filed from table
            var wdmSubCategory = await _publishingContext.WdmSubCategory.AddAsync(savingData);
            var saved = await _publishingContext.SaveChangesAsync() > 0;
            if (saved)
            {
                var keysUpdating = $"{Constants.CacheKeyName.SubCategoryList}{savingData.WdmCategoryId}";

                var subcategories = await _publishingContext.WdmSubCategory.Where(w =>
                    w.WdmCategoryId == savingData.WdmCategoryId
                    && w.ActiveFlg == "Yes"
                    && w.DeletedFlg == "No").ToListAsync();

                if (!await CachedRepository.Update(keysUpdating, subcategories))
                {
                    Serilog.Log.Logger.Warning($"SaveSubCategory: Not updated cache successfully for sub categories of category: [{savingData.WdmCategoryId}]");
                }
            }

            return wdmSubCategory.Entity.WdmSubCategoryKey;
        }
    }
}
