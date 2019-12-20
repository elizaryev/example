using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using DesignClient;
using EnsureThat;
using MemberCommon.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using Publishing.Entities;
using Publishing.Misc;
using Publishing.Repository;
using Publishing.Repository.Context;
using Publishing.Repository.DTO;
using PublishingCommon;
using PublishingCommon.Enums;
using PublishingCommon.Model;
using PublishingCommon.RequestModel;
using Utils.Helper;

namespace Publishing.BusinessLogic
{
    public class PublishingService: IPublishingService
    {
        private readonly IMapper _mapper;
        private readonly PublishingContext _publishingContext;
        private readonly WdmItemUpdatingHandler _publishedWdmItemHandler;
        private readonly PublishingServiceSettings _publishingServiceSettings;
        private readonly GalleryClient.IGalleryOperationService _galleryOperationService;
        private readonly DesignClient.IDesignService _designParameterService;
        private readonly DesignClient.IProductService _productService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly PublishedItemFilteringHandler _filterHandler;
        private readonly WdmResourcesClient.IWdmResourcesService _wdmResourcesService;

        private MemberModel MemberInfo => (MemberModel)_httpContextAccessor.HttpContext.Items[
            _httpContextAccessor.HttpContext.Request.Headers["token"]];

        public PublishingService(PublishingContext publishingContext, IMapper mapper,
            DesignClient.IDesignService designParameterService,
            IOptions<PublishingServiceSettings> publishingServiceSettings,
            GalleryClient.IGalleryOperationService galleryOperationService, 
            IProductService productService, IHttpContextAccessor httpContextAccessor,
            WdmResourcesClient.IWdmResourcesService wdmResourcesService)
        {
            _publishingContext = publishingContext;
            _mapper = mapper;
            _publishingServiceSettings = publishingServiceSettings.Value;
            _galleryOperationService = galleryOperationService;
            _productService = productService;
            _designParameterService = designParameterService;
            _httpContextAccessor = httpContextAccessor;
            _wdmResourcesService = wdmResourcesService;

            _publishedWdmItemHandler = new PublishedWdmItemHandler(_mapper, _publishingContext, _galleryOperationService);
            WdmItemUpdatingHandler rejectOperationHandler = new RejectWdmItemHandler(_mapper, _publishingContext, _galleryOperationService);
            WdmItemUpdatingHandler revokeOperationHandler = new RevokeWdmItemHandler(_mapper, _publishingContext, _galleryOperationService);
            WdmItemUpdatingHandler suspendOperationHandler = new SuspendWdmItemHandler(_mapper, _publishingContext, _galleryOperationService);
            WdmItemUpdatingHandler resumeOperationHandler = new ResumeWdmItemHandler(_mapper, _publishingContext, _galleryOperationService);
            WdmItemUpdatingHandler unpublishOperationHandler = new UnpublishWdmItemHandler(_mapper, _publishingContext, _galleryOperationService);
            WdmItemUpdatingHandler requestOperationHandler = new RequestWdmItemHandler(_mapper, _publishingContext, _galleryOperationService, _httpContextAccessor);

            _publishedWdmItemHandler.SetResponsibilityHandler(rejectOperationHandler);
            rejectOperationHandler.SetResponsibilityHandler(revokeOperationHandler);
            revokeOperationHandler.SetResponsibilityHandler(suspendOperationHandler);
            suspendOperationHandler.SetResponsibilityHandler(resumeOperationHandler);
            resumeOperationHandler.SetResponsibilityHandler(unpublishOperationHandler);
            unpublishOperationHandler.SetResponsibilityHandler(requestOperationHandler);

            _filterHandler = new NcrPublishedItemFilteringHandler(_publishingContext);
            var exactProdFilterHandler = new ExactProductPublishedItemFilteringHandler();
            var exactSizeFilterHandler = new ExactSizePublishedItemFilteringHandler(_productService);
            var genericSizeFilterHandler = new GenericSizePublishedItemFilteringHandler(_wdmResourcesService);

            _filterHandler.SetNextFilteringHandler(exactProdFilterHandler);
            exactProdFilterHandler.SetNextFilteringHandler(exactSizeFilterHandler);
            exactSizeFilterHandler.SetNextFilteringHandler(genericSizeFilterHandler);

        }

        public async Task<int> Save(JObject data)
        {
            WdmItemModel publishingData = data["publishingData"].ToObject<WdmItemModel>();

            bool allImmediately = false;
            if (data.ContainsKey("allImmediately"))
                allImmediately = data["allImmediately"].ToObject<bool>();

            #region ensure block
            Ensure.Any.IsNotNull<WdmItemModel>(publishingData);
            Ensure.That(publishingData.WdmCategoryId).IsNotNullOrEmpty();
            Ensure.That(publishingData.WdmSubCategoryId).IsNotNullOrEmpty();
            #endregion ensure block

            var saveData = _mapper.Map<WdmItem>(publishingData);
            var now = DateTime.Now;
            var savingDate = now.ToString("yyyyMMdd");

            // use generation guid for wdmitemid
            Guid guid = Guid.NewGuid();
            byte[] bytes = guid.ToByteArray();
            string encoded = Convert.ToBase64String(bytes);
            saveData.WdmItemId = encoded;

            // or mb we can usage a hash of the storage path
            //if (!string.IsNullOrEmpty(saveData.StoragePath))
            //{
            //    var hash = saveData.StoragePath.Split('/').Last();
            //    if(!string.IsNullOrEmpty(hash))
            //        saveData.WdmItemId = hash;
            //    else
            //    {
            //        Guid guid = Guid.NewGuid();
            //        byte[] bytes = guid.ToByteArray();
            //        string encoded = Convert.ToBase64String(bytes);
            //        saveData.WdmItemId = encoded;
            //    }
            //}

            saveData.PublishStatus = PublishStatusType.Requested.ToString();
            saveData.PublishYyyymmdd = savingDate;
            //saveData.Tstamp = Helper.ConvertToTimestamp(now);
            saveData.Description = Helper.SanitizeHtml(saveData.Description);

            string cacheKey = $"{Constants.CacheKeyName.CategoryId}{saveData.WdmCategoryId}";
            var category = await _publishingContext.WdmCategory.CachedFirstOrDefaultAsync(f => f.WdmCategoryId == saveData.WdmCategoryId, cacheKey);
            string itemType = "";
            if (category != null)
            {
                itemType = category.ContentType;
            }

            // hardcode checking
            if (itemType != "image")
            {
                var designParameters = await _designParameterService.GetByDesignName(saveData.StoragePath, false);
                if (designParameters != null)
                {
                    var productInfo = await _productService.GetProdTypeById(designParameters.ProdTypeId);
                    saveData.ProdType = productInfo.ProdTypeKey;
                    saveData.SizeDimension = designParameters.SizeDimension;
                    var sdInfo = await _productService.GetSizeDimensionById(designParameters.SizeDimension);
                    saveData.SizeHeightDesign = sdInfo.SizeHDesign;
                    saveData.SizeWidthDesign = sdInfo.SizeWDesign;
                }
            }

            // Move symlink
            await _galleryOperationService.DoPublising(saveData.StoragePath, itemType, PublishStatusType.None,
                PublishStatusType.Requested);
            
            // create wdm item
            var wdmItem = await _publishingContext.WdmItem.AddAsync(saveData);
            var resultSaved = await _publishingContext.SaveChangesAsync();

            // log
            var wdmItemLog = new WdmItemLog
            {
                WdmItem = wdmItem.Entity.WdmItemKey,
                LogYyyymmdd = savingDate,
                LogType = LogType.Publishing.ToString(),
                LoggerType = LoggerType.Member.ToString(),
                LoggerId = saveData.Member.ToString(),
                LogText = "Publishing",
                Price = saveData.Price
            };
            var wdmItemLogResult = await _publishingContext.WdmItemLog.AddAsync(wdmItemLog);
            var resultLogSaved = await _publishingContext.SaveChangesAsync() > 0;
            if (resultLogSaved)
            {
                var cacheLogKey = $"{Constants.CacheKeyName.ItemLog}{wdmItemLog.WdmItem}";
                List<WdmItemLog> cachedWdmItemLoglist = await _publishingContext.WdmItemLog.CachedWhereAsync(w => w.WdmItem == wdmItemLog.WdmItem, cacheLogKey);

                if (!await CachedRepository.Update(cacheLogKey, cachedWdmItemLoglist))
                {
                    Serilog.Log.Logger.Warning($"UpdateWdmItem: Can't update cached value for wdm item:[{wdmItemLog.WdmItem}]");
                }
            }

            // do approve operation too
            if (allImmediately)
            {
                await _galleryOperationService.DoPublising(saveData.StoragePath, itemType, PublishStatusType.Requested,
                    PublishStatusType.Published);

                wdmItem.Entity.PublishStatus = PublishStatusType.Published.ToString();
                _publishingContext.WdmItem.Update(wdmItem.Entity);
                await _publishingContext.SaveChangesAsync();

                var wdmItemAutoApproveLog = new WdmItemLog
                {
                    WdmItem = wdmItem.Entity.WdmItemKey,
                    LogYyyymmdd = savingDate,
                    LogType = LogType.Publishing.ToString(),
                    LoggerType = LoggerType.Member.ToString(),
                    LoggerId = saveData.Member.ToString(),
                    LogText = "Automatically setting the request status to the approved status for all immediate actions",
                    Price = saveData.Price
                };

                wdmItemLogResult = await _publishingContext.WdmItemLog.AddAsync(wdmItemAutoApproveLog);
                resultLogSaved = await _publishingContext.SaveChangesAsync() > 0;
                if (resultLogSaved)
                {
                    var cacheLogKey = $"{Constants.CacheKeyName.ItemLog}{wdmItemAutoApproveLog.WdmItem}";
                    List<WdmItemLog> cachedWdmItemLoglist = await _publishingContext.WdmItemLog.CachedWhereAsync(w => w.WdmItem == wdmItemAutoApproveLog.WdmItem, cacheLogKey);

                    if (!await CachedRepository.Update(cacheLogKey, cachedWdmItemLoglist))
                    {
                        Serilog.Log.Logger.Warning($"UpdateWdmItem: Can't update cached value for wdm item:[{wdmItemAutoApproveLog.WdmItem}]");
                    }
                }
            }

            // todo: mb in future will save in cache
            //var savingTagList = new List<TagItem>();
            //var allStoredTags = await _tagService.GetAllTags();
            //foreach (string keyword in itemData.KeywordsText.Split(','))
            //{
            //    if(allStoredTags.Any(a => a.Text.ToLower() == keyword.ToLower()))
            //        continue;

            //    savingTagList.Add(new TagItem{Key = keyword, Text = keyword, Value = keyword});
            //}
            //await _tagService.SaveTagList(savingTagList);

            return wdmItem.Entity.WdmItemKey;
        }

        public async Task<bool> Remove(int wdmItem)
        {
            string cacheKey = $"{Constants.CacheKeyName.WdmItemKey}{wdmItem}";
            var item = await _publishingContext.WdmItem.CachedFirstOrDefaultAsync(f => f.WdmItemKey == wdmItem, cacheKey);
            try
            {
                item.ActiveFlg = "No";
                _publishingContext.WdmItem.Update(item);
                var saved = _publishingContext.SaveChanges() > 0;
                if(saved)
                    if (!await CachedRepository.Update(cacheKey, item))
                    {
                        Serilog.Log.Logger.Warning($"UpdateWdmItem: Can't update cached value for key:[{cacheKey}]");
                    }

                return saved;
            }
            catch (Exception e)
            {
                Serilog.Log.Error(e, string.Empty);
                return false;
            }
        }

        public async Task<List<WdmItemModel>> GetPublishedList(PublishStatusType publishStatusType, JObject requestData)
        {
            #region read args
            Ensure.Any.IsNotNull<JObject>(requestData);
            if (!requestData.HasValues)
            {
                Serilog.Log.Logger.Error("Error: Request data is empty!");
                return new List<WdmItemModel>();
            }

            // parse input params
            var request = requestData.ToObject<GetterPublishedRequest>();
            if (!request.Valid())
            {
                Serilog.Log.Logger.Error("Error: Request data is not valid!");
                return new List<WdmItemModel>();
            }
            #endregion read args

            #region prepare filtering condition
            // basic filtering
            var listPrepare = _publishingContext.WdmItem
                .Where(w => w.ActiveFlg == "Yes" && w.PublishStatus == publishStatusType.ToString()
                                                 && (string.IsNullOrEmpty(request.WdmCategoryId) ||
                                                     w.WdmCategoryId == request.WdmCategoryId)
                                                 && (!request.OnlyMember || w.Member == MemberInfo.MemberKey));

            listPrepare = _filterHandler.GetFiltrationQuery(request.SizeMatching, listPrepare, request);

            listPrepare = listPrepare
                .Skip(request.Start ?? 0)
                .Take(request.Take ?? _publishingContext.WdmItem.Count());
            #endregion prepare filtering condition

            // take data
            var list = await listPrepare.ToListAsync();
            List<WdmItemModel> result = _mapper.Map<List<WdmItemModel>>(list);
            return result;
        }

        public async Task<List<WdmItemModel>> GetUnpublishedList(JObject data)
        {
            #region read args

            if (!data.ContainsKey("wdmCategoryId"))
                return new List<WdmItemModel>();

            string wdmCategoryId = data["wdmCategoryId"].ToObject<string>();

            bool? alreadyMoved = null;
            if (data.ContainsKey("alreadyMoved") && ((JValue)data["alreadyMoved"]).Value != null)
                alreadyMoved = data["alreadyMoved"].ToObject<bool>();

            int? start = null;
            if (data.ContainsKey("start") && ((JValue)data["start"]).Value != null)
                start = data["start"].ToObject<int>();

            int? take = null;
            if (data.ContainsKey("take") && ((JValue)data["start"]).Value != null)
                take = data["take"].ToObject<int>();
            #endregion read args

            var list = _publishingContext.WdmItem
                .Where(w => w.ActiveFlg == "Yes"
                            && w.PublishStatus == PublishStatusType.Unpublished.ToString()
                            && w.PublishStatusDisposition != PublishStatusDispositionType.Delete.ToString()
                            && (string.IsNullOrEmpty(wdmCategoryId) || w.WdmCategoryId == wdmCategoryId)
                            && w.Member == MemberInfo.MemberKey);

            if (!alreadyMoved.HasValue || !alreadyMoved.Value)
            {
                list = list.Where(w => w.PublishStatusDisposition != PublishStatusDispositionType.Move.ToString());
            }

            await list.Skip((start.HasValue && take.HasValue) ? start.Value : 0)
                .Take((start.HasValue && take.HasValue) ? take.Value : _publishingContext.WdmItem.Count())
                .ToListAsync();
            List<WdmItemModel> result = _mapper.Map<List<WdmItemModel>>(list);
            return result;
        }

        public async Task<List<string>> GetPublishedItemNameList(string wdmCategoryId, bool onlyMember)
        {
            // check a special behavior when we need getting onlyMember items, but a memberInfo not have a value
            // then we return an empty value
            if (onlyMember && MemberInfo == null)
            {
                return new List<string>();
            }

            string cacheKey = $"{Constants.CacheKeyName.CategoryId}{wdmCategoryId}";
            var category = await _publishingContext.WdmCategory.CachedFirstOrDefaultAsync(f => f.WdmCategoryId == wdmCategoryId, cacheKey);
            if (category == null)
            {
                return new List<string>();
            }
            string itemType = category.ContentType;

            var nameList = await _publishingContext.WdmItem.Where(w => w.ActiveFlg == "Yes"
                                                                   && w.WdmCategoryId == itemType
                                                                   && w.PublishStatus == PublishStatusType.Published.ToString()
                                                                   && (!onlyMember || w.Member == MemberInfo.MemberKey))
                                                        .Select(s => s.ItemName).ToListAsync();
            return nameList;
        }

        public async Task<List<WdmItemLogModel>> GetPublishProcessingLogs(int wdmItem)
        {
            //List<WdmItemLog> list = await _publishingContext.WdmItemLog.Where(w => w.WdmItem == wdmItem).ToListAsync();
            var cecheKey = $"{Constants.CacheKeyName.ItemLog}{wdmItem}";
            List<WdmItemLog> list = await _publishingContext.WdmItemLog.CachedWhereAsync(w => w.WdmItem == wdmItem, cecheKey);
            List<WdmItemLogModel> result = _mapper.Map<List<WdmItemLogModel>>(list);
            return result;
        }

        public async Task<WdmItemModel> GetPublished(int wdmItem)
        {
            string cacheKey = $"{Constants.CacheKeyName.WdmItemKey}{wdmItem}";
            var published = await _publishingContext.WdmItem.CachedFirstOrDefaultAsync(f => f.WdmItemKey == wdmItem, cacheKey);
            if(published == null)
                return new WdmItemModel();
            var result = _mapper.Map<WdmItemModel>(published);
            
            //todo: in the future add to cache
            var employeeLastLogInfo = await _publishingContext.WdmItemLog.LastOrDefaultAsync(l =>
                l.WdmItem == wdmItem && l.LogText == _publishingServiceSettings.LogTextHandlerEmployee);

            result.EmployeeID = employeeLastLogInfo?.LoggerId;
            return result;
        }

        public async Task<WdmItemModel> GetPublishedByHash(string hash)
        {
            #region ensure block
            Ensure.That(hash).IsNotNullOrEmpty();
            #endregion ensure block

            string cacheKey = $"{Constants.CacheKeyName.WdmItemStorePath}{hash}";
            var published = await _publishingContext.WdmItem.CachedFirstOrDefaultAsync(f => f.StoragePath.Contains(hash), cacheKey);
            if (published == null)
                return new WdmItemModel();
            var result = _mapper.Map<WdmItemModel>(published);
            return result;
        }

        /// <summary>
        /// Usage to change publish status
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        public async Task<bool> ChangePublishStatus(JObject model)
        {
            var wdmItem = model["wdmItem"].ToObject<WdmItemModel>();
            var log = model["log"].ToObject<WdmItemLogModel>();

            Ensure.Any.IsNotNull<WdmItemModel>(wdmItem);
            Ensure.Any.IsNotNull<WdmItemLogModel>(log);

            var operation = Enum.Parse<PublishStatusType>(wdmItem.PublishStatus);
            return await _publishedWdmItemHandler.RunOperation(operation, wdmItem, log);
        }

        public async Task<(bool result, string errMsg)> UpdateWdmItem(WdmItemModel inputItemData)
        {
            #region ensure block
            Ensure.Any.IsNotNull<WdmItemModel>(inputItemData);
            #endregion ensure block

            string cacheKey = $"{Constants.CacheKeyName.WdmItemKey}{inputItemData.WdmItemKey}";
            var storageWdmItem = await _publishingContext.WdmItem
                .CachedFirstOrDefaultAsync(f => f.WdmItemKey == inputItemData.WdmItemKey, cacheKey);
            if (storageWdmItem == null)
            {
                if(!string.IsNullOrEmpty(inputItemData.StoragePath))
                    return await _galleryOperationService.RenameItem(inputItemData.StoragePath, inputItemData.ItemName);

                // just change on client side without saved wdmItem DB item
                return (true, string.Empty);
            }

            var now = DateTime.Now;
            // calc a rating values
            var ratingList = _publishingContext.WdmRating.Where(w => w.WdmItemIdOrMember == inputItemData.WdmItemKey.ToString());
            storageWdmItem.CountWdmRating = ratingList.Count();
            List<short?> list = new List<short?>();
            foreach (var ratingItem in ratingList) list.Add(ratingItem.Rating);
            storageWdmItem.WdmRating = Calculation.RatingValue(list);
            
            var insertedLog = new WdmItemLog();
            if (storageWdmItem.Price != inputItemData.Price)
            {
                storageWdmItem.Price = inputItemData.Price;
                
                // insert log
                var logDTO = new WdmItemLog
                {
                    WdmItem = inputItemData.WdmItemKey,
                    LogYyyymmdd = DateTime.Now.ToString("yyyyMMdd"),
                    LogType = LogType.Pricing.ToString(),
                    LoggerType = LoggerType.Member.ToString(),
                    LoggerId = inputItemData.Member.ToString(),
                    Price = inputItemData.Price,
                    LogText = "update price"
                };
                var inserted = await _publishingContext.WdmItemLog.AddAsync(logDTO);
                insertedLog = inserted.Entity;
            }

            bool changeItemName = storageWdmItem.ItemName != inputItemData.ItemName;
            if (changeItemName)
            {
                storageWdmItem.ItemName = inputItemData.ItemName;
            }
            if (storageWdmItem.Description != inputItemData.Description)
            {
                storageWdmItem.Description = Helper.SanitizeHtml(inputItemData.Description);
            }
            if (storageWdmItem.KeywordsText != inputItemData.KeywordsText)
            {
                storageWdmItem.KeywordsText = inputItemData.KeywordsText;
            }

            if (storageWdmItem.PublishStatusDisposition != inputItemData.PublishStatusDisposition)
            {
                storageWdmItem.PublishStatusDisposition = inputItemData.PublishStatusDisposition;
                if (inputItemData.PublishStatusDisposition?.ToLower() == "delete")
                {
                    storageWdmItem.ActiveFlg = "No";
                }
            }

            _publishingContext.WdmItem.Update(storageWdmItem);
            
            using (var tran = _publishingContext.Database.BeginTransaction())
            {
                var saved = await _publishingContext.SaveChangesAsync() > 0;

                if (changeItemName)
                {
                    var renameItemResult = await _galleryOperationService.RenameItem(storageWdmItem.StoragePath, inputItemData.ItemName);
                    if (renameItemResult.result)
                    {
                        tran.Commit();

                        //copy past coding
                        if (saved)
                        {
                            var keysUpdating = new List<string>();
                            keysUpdating.Add(cacheKey);
                            keysUpdating.Add($"{Constants.CacheKeyName.WdmItemStorePath}{storageWdmItem.StoragePath}");

                            if (!await CachedRepository.UpdateAll(keysUpdating, storageWdmItem))
                            {
                                Serilog.Log.Logger.Warning($"UpdateWdmItem: Not all keys were successfully updated for wdm item:[{insertedLog.WdmItem}]");
                            }

                            var cacheLogKey = $"{Constants.CacheKeyName.ItemLog}{insertedLog.WdmItem}";
                            List<WdmItemLog> cachedWdmItemLoglist = await _publishingContext.WdmItemLog
                                .CachedWhereAsync(w => w.WdmItem == insertedLog.WdmItem, cacheLogKey);

                            if (!await CachedRepository.Update(cacheLogKey, cachedWdmItemLoglist))
                            {
                                Serilog.Log.Logger.Warning($"UpdateWdmItem: Can't update cached value for wdm item:[{insertedLog.WdmItem}]");
                            }
                        }

                        return (true, string.Empty);
                    }
                    else
                    {
                        tran.Rollback();
                        return renameItemResult;
                    }
                }
                else
                {
                    //copy past coding
                    if (saved)
                    {
                        var keysUpdating = new List<string>();
                        keysUpdating.Add(cacheKey);
                        keysUpdating.Add($"{Constants.CacheKeyName.WdmItemStorePath}{storageWdmItem.StoragePath}");

                        if (!await CachedRepository.UpdateAll(keysUpdating, storageWdmItem))
                        {
                            Serilog.Log.Logger.Warning($"UpdateWdmItem: Not all keys were successfully updated for wdm item:[{insertedLog.WdmItem}]");
                        }

                        var cacheLogKey = $"{Constants.CacheKeyName.ItemLog}{insertedLog.WdmItem}";
                        List<WdmItemLog> cachedWdmItemLoglist = await _publishingContext.WdmItemLog
                            .CachedWhereAsync(w => w.WdmItem == insertedLog.WdmItem, cacheLogKey);

                        if (!await CachedRepository.Update(cacheLogKey, cachedWdmItemLoglist))
                        {
                            Serilog.Log.Logger.Warning($"UpdateWdmItem: Can't update cached value for wdm item:[{insertedLog.WdmItem}]");
                        }
                    }

                    tran.Commit();
                    return (true, string.Empty);
                }
            }
        }
    }
}
