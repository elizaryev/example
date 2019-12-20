using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using MemberCommon.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Publishing.Repository;
using Publishing.Repository.Context;
using Publishing.Repository.DTO;
using PublishingCommon.Enums;
using PublishingCommon.Model;
using Serilog;
using Utils.Helper;

namespace Publishing.Misc
{
    public abstract class WdmItemUpdatingHandler
    {
        protected WdmItemUpdatingHandler Handler;
        protected PublishingContext _publishingContext;
        protected GalleryClient.IGalleryOperationService _galleryOperationService;
        protected IMapper Mapper;

        protected WdmItemUpdatingHandler()
        {
        }

        public void SetResponsibilityHandler(WdmItemUpdatingHandler handler)
        {
            Handler = handler;
        }

        public abstract Task<bool> RunOperation(PublishStatusType operation, WdmItemModel item, WdmItemLogModel log);

        protected async Task MoveItemFolderInNextStep(WdmItemModel item, PublishStatusType currPublishStatus, 
            PublishStatusType nextPublishStatusType)
        {
            var category = await _publishingContext.WdmCategory.FirstOrDefaultAsync(f => f.WdmCategoryId == item.WdmCategoryId);
            string itemType = "";
            if (category != null)
            {
                itemType = category.ContentType;
            }

            await _galleryOperationService.DoPublising(item.StoragePath, itemType, currPublishStatus, nextPublishStatusType);
        }
    }

    public class PublishedWdmItemHandler : WdmItemUpdatingHandler
    {
        public PublishedWdmItemHandler(IMapper mapper, PublishingContext publishingContext,
            GalleryClient.IGalleryOperationService galleryOperationService)
        {
            _publishingContext = publishingContext;
            _galleryOperationService = galleryOperationService;
            Mapper = mapper;
        }

        public override async Task<bool> RunOperation(PublishStatusType operation, WdmItemModel item, WdmItemLogModel log)
        {
            if (operation == PublishStatusType.Published)
            {
                if (!Enum.TryParse(typeof(PublishStatusType), item.PublishStatus, true, out var currPublishStatus))
                {
                    Log.Error($"Can't parse publish status:[{item.PublishStatus}] to PublishStatusType");
                    return false;
                }
                if ((PublishStatusType)currPublishStatus != PublishStatusType.Requested)
                {
                    Log.Error($"Previously, the status type should be 'Requested', but now it is:[{item.PublishStatus}]");
                    return false;
                }

                // update wdm_item
                var cacheKey = $"{Constants.CacheKeyName.WdmItemKey}{item.WdmItemKey}";
                var itemDTO = await _publishingContext.WdmItem.CachedFirstOrDefaultAsync(f => f.WdmItemKey == item.WdmItemKey, cacheKey);
                if (itemDTO == null)
                {
                    Log.Error($"Can't find wdm item by:[{item.WdmItemKey}]");
                    return false;
                }
                
                await MoveItemFolderInNextStep(item, (PublishStatusType)currPublishStatus, PublishStatusType.Requested);
                
                var now = DateTime.Now;
                var approveDate = now.ToString("yyyyMMdd");
                itemDTO.PublishYyyymmdd = approveDate;
                itemDTO.PublishStatus = PublishStatusType.Published.ToString();
                var updatedItem = _publishingContext.WdmItem.Update(itemDTO);
                var updated = await _publishingContext.SaveChangesAsync() > 0;
                if (updated)
                {
                    var keysUpdating = new List<string>();
                    keysUpdating.Add(cacheKey);
                    keysUpdating.Add($"{Constants.CacheKeyName.WdmItemStorePath}{item.StoragePath}");
                    if (!await CachedRepository.UpdateAll(keysUpdating, itemDTO))
                    {
                        Serilog.Log.Logger.Warning($"UpdateWdmItem: Not all keys were successfully updated for wdm item:[{item.WdmItemKey}]");
                    }
                }

                // insert log
                log.LogYyyymmdd = approveDate;
                log.LogType = LogType.Publishing.ToString();
                log.LoggerType = LoggerType.Employee.ToString();
                log.Price = item.Price;
                var logDTO = Mapper.Map<WdmItemLog>(log);

                var insertedLog = await _publishingContext.WdmItemLog.AddAsync(logDTO);
                var saved = await _publishingContext.SaveChangesAsync() > 0;
                //copy past coding
                if (saved)
                {
                    var cacheLogKey = $"{Constants.CacheKeyName.ItemLog}{insertedLog.Entity.WdmItem}";
                    List<WdmItemLog> cachedWdmItemLoglist = await _publishingContext.WdmItemLog
                        .CachedWhereAsync(w => w.WdmItem == insertedLog.Entity.WdmItem, cacheLogKey);

                    if (!await CachedRepository.Update(cacheLogKey, cachedWdmItemLoglist))
                    {
                        Serilog.Log.Logger.Warning($"Published action: Can't update cached value for wdm item:[{insertedLog.Entity.WdmItem}]");
                    }
                }

                // move the item folder into the published folder of the current member
            }
            else if (Handler != null)
            {
                await Handler.RunOperation(operation, item, log);
            }
            else
            {
                Log.Error($"Can't find any handler for operation:[{operation}]");
                return false;
            }
            return true;
        }
    }

    public class RejectWdmItemHandler : WdmItemUpdatingHandler
    {
        public RejectWdmItemHandler(IMapper mapper, PublishingContext publishingContext,
            GalleryClient.IGalleryOperationService galleryOperationService) 
        {
            _publishingContext = publishingContext;
            _galleryOperationService = galleryOperationService;
            Mapper = mapper;
        }

        public override async Task<bool> RunOperation(PublishStatusType operation, WdmItemModel item, WdmItemLogModel log)
        {
            if (operation == PublishStatusType.Rejected)
            {
                // update wdm_item
                var cacheKey = $"{Constants.CacheKeyName.WdmItemKey}{item.WdmItemKey}";
                var itemDTO = await _publishingContext.WdmItem.CachedFirstOrDefaultAsync(f => f.WdmItemKey == item.WdmItemKey, cacheKey);
                if (itemDTO == null)
                {
                    Log.Error($"Can't find wdm item by:[{item.WdmItemKey}]");
                    return false;
                }

                if (itemDTO.PublishStatus != PublishStatusType.Requested.ToString())
                {
                    Log.Error($"Previously, the status type should be 'Requested', but now it is:[{item.PublishStatus}]");
                    return false;
                }

                Enum.TryParse(typeof(PublishStatusType), itemDTO.PublishStatus, true, out var currPublishStatus);
                item.StoragePath = itemDTO.StoragePath;
                item.WdmCategoryId = itemDTO.WdmCategoryId;
                await MoveItemFolderInNextStep(item, (PublishStatusType)currPublishStatus, PublishStatusType.Rejected);

                var now = DateTime.Now;
                var rejectDate = now.ToString("yyyyMMdd");
                itemDTO.PublishYyyymmdd = rejectDate;
                itemDTO.PublishStatus = PublishStatusType.Rejected.ToString();
                var updatedItem = _publishingContext.WdmItem.Update(itemDTO);
                var updated = await _publishingContext.SaveChangesAsync() > 0;
                if (updated)
                {
                    var keysUpdating = new List<string>();
                    keysUpdating.Add(cacheKey);
                    keysUpdating.Add($"{Constants.CacheKeyName.WdmItemStorePath}{item.StoragePath}");
                    if (!await CachedRepository.UpdateAll(keysUpdating, itemDTO))
                    {
                        Serilog.Log.Logger.Warning($"UpdateWdmItem: Not all keys were successfully updated for wdm item:[{item.WdmItemKey}]");
                    }
                }

                // insert log
                log.LogYyyymmdd = rejectDate;
                log.LogType = LogType.Publishing.ToString();
                log.LoggerType = LoggerType.Employee.ToString();
                
                var logDTO = Mapper.Map<WdmItemLog>(log);

                var insertedLog = await _publishingContext.WdmItemLog.AddAsync(logDTO);
                var saved = await _publishingContext.SaveChangesAsync() > 0;
                //copy past coding
                if (saved)
                {
                    var cacheLogKey = $"{Constants.CacheKeyName.ItemLog}{insertedLog.Entity.WdmItem}";
                    List<WdmItemLog> cachedWdmItemLoglist = await _publishingContext.WdmItemLog
                        .CachedWhereAsync(w => w.WdmItem == insertedLog.Entity.WdmItem, cacheLogKey);

                    if (!await CachedRepository.Update(cacheLogKey, cachedWdmItemLoglist))
                    {
                        Serilog.Log.Logger.Warning($"Reject action: Can't update cached value for wdm item:[{insertedLog.Entity.WdmItem}]");
                    }
                }

                // move the item folder into the published folder of the current member
            }
            else if (Handler != null)
            {
                await Handler.RunOperation(operation, item, log);
            }
            else
            {
                Log.Error($"Can't find any handler for operation:[{operation}]");
                return false;
            }
            return true;
        }
    }

    public class RevokeWdmItemHandler : WdmItemUpdatingHandler
    {
        public RevokeWdmItemHandler(IMapper mapper, PublishingContext publishingContext,
            GalleryClient.IGalleryOperationService galleryOperationService)
        {
            _publishingContext = publishingContext;
            _galleryOperationService = galleryOperationService;
            Mapper = mapper;
        }

        public override async Task<bool> RunOperation(PublishStatusType operation, WdmItemModel item, WdmItemLogModel log)
        {
            if (operation == PublishStatusType.Revoked)
            {
                // update wdm_item
                var cacheKey = $"{Constants.CacheKeyName.WdmItemKey}{item.WdmItemKey}";
                var itemDTO = await _publishingContext.WdmItem.CachedFirstOrDefaultAsync(f => f.WdmItemKey == item.WdmItemKey, cacheKey);
                if (itemDTO == null)
                {
                    Log.Error($"Can't find wdm item by:[{item.WdmItemKey}]");
                    return false;
                }

                if (itemDTO.PublishStatus != PublishStatusType.Published.ToString())
                {
                    Log.Error($"Previously, the status type should be 'Published', but now it is:[{item.PublishStatus}]");
                    return false;
                }

                Enum.TryParse(typeof(PublishStatusType), itemDTO.PublishStatus, true, out var currPublishStatus);
                item.StoragePath = itemDTO.StoragePath;
                item.WdmCategoryId = itemDTO.WdmCategoryId;
                await MoveItemFolderInNextStep(item, (PublishStatusType)currPublishStatus, PublishStatusType.Revoked);

                var now = DateTime.Now;
                var revokeDate = now.ToString("yyyyMMdd");
                itemDTO.PublishYyyymmdd = revokeDate;
                itemDTO.PublishStatus = PublishStatusType.Revoked.ToString();
                var updatedItem = _publishingContext.WdmItem.Update(itemDTO);
                var updated = await _publishingContext.SaveChangesAsync() > 0;
                if (updated)
                {
                    var keysUpdating = new List<string>();
                    keysUpdating.Add(cacheKey);
                    keysUpdating.Add($"{Constants.CacheKeyName.WdmItemStorePath}{item.StoragePath}");
                    if (!await CachedRepository.UpdateAll(keysUpdating, itemDTO))
                    {
                        Serilog.Log.Logger.Warning($"UpdateWdmItem: Not all keys were successfully updated for wdm item:[{item.WdmItemKey}]");
                    }
                }

                // insert log
                log.LogYyyymmdd = revokeDate;
                log.LogType = LogType.Publishing.ToString();
                log.LoggerType = LoggerType.Employee.ToString();

                var logDTO = Mapper.Map<WdmItemLog>(log);

                var insertedLog = await _publishingContext.WdmItemLog.AddAsync(logDTO);
                var saved = await _publishingContext.SaveChangesAsync() > 0;
                //copy past coding
                if (saved)
                {
                    var cacheLogKey = $"{Constants.CacheKeyName.ItemLog}{insertedLog.Entity.WdmItem}";
                    List<WdmItemLog> cachedWdmItemLoglist = await _publishingContext.WdmItemLog
                        .CachedWhereAsync(w => w.WdmItem == insertedLog.Entity.WdmItem, cacheLogKey);

                    if (!await CachedRepository.Update(cacheLogKey, cachedWdmItemLoglist))
                    {
                        Serilog.Log.Logger.Warning($"Revoke action: Can't update cached value for wdm item:[{insertedLog.Entity.WdmItem}]");
                    }
                }

                // move the item folder into the published folder of the current member
            }
            else if (Handler != null)
            {
                await Handler.RunOperation(operation, item, log);
            }
            else
            {
                Log.Error($"Can't find any handler for operation:[{operation}]");
                return false;
            }
            return true;
        }
    }

    public class SuspendWdmItemHandler : WdmItemUpdatingHandler
    {
        public SuspendWdmItemHandler(IMapper mapper, PublishingContext publishingContext,
            GalleryClient.IGalleryOperationService galleryOperationService)
        {
            _publishingContext = publishingContext;
            _galleryOperationService = galleryOperationService;
            Mapper = mapper;
        }

        public override async Task<bool> RunOperation(PublishStatusType operation, WdmItemModel item, WdmItemLogModel log)
        {
            if (operation == PublishStatusType.Suspended)
            {
                // update wdm_item
                var cacheKey = $"{Constants.CacheKeyName.WdmItemKey}{item.WdmItemKey}";
                var itemDTO = await _publishingContext.WdmItem.CachedFirstOrDefaultAsync(f => f.WdmItemKey == item.WdmItemKey, cacheKey);
                if (itemDTO == null)
                {
                    Log.Error($"Can't find wdm item by:[{item.WdmItemKey}]");
                    return false;
                }

                if (itemDTO.PublishStatus != PublishStatusType.Published.ToString())
                {
                    Log.Error($"Previously, the status type should be 'Published', but now it is:[{item.PublishStatus}]");
                    return false;
                }

                Enum.TryParse(typeof(PublishStatusType), itemDTO.PublishStatus, true, out var currPublishStatus);
                item.StoragePath = itemDTO.StoragePath;
                item.WdmCategoryId = itemDTO.WdmCategoryId;
                await MoveItemFolderInNextStep(item, (PublishStatusType)currPublishStatus, PublishStatusType.Suspended);

                var now = DateTime.Now;
                var suspendDate = now.ToString("yyyyMMdd");
                itemDTO.PublishYyyymmdd = suspendDate;
                itemDTO.PublishStatus = PublishStatusType.Suspended.ToString();
                var updatedItem = _publishingContext.WdmItem.Update(itemDTO);
                var updated = await _publishingContext.SaveChangesAsync() > 0;
                if (updated)
                {
                    var keysUpdating = new List<string>();
                    keysUpdating.Add(cacheKey);
                    keysUpdating.Add($"{Constants.CacheKeyName.WdmItemStorePath}{item.StoragePath}");
                    if (!await CachedRepository.UpdateAll(keysUpdating, itemDTO))
                    {
                        Serilog.Log.Logger.Warning($"UpdateWdmItem: Not all keys were successfully updated for wdm item:[{item.WdmItemKey}]");
                    }
                }

                // insert log
                log.LogYyyymmdd = suspendDate;
                log.LogType = LogType.Publishing.ToString();
                log.LoggerType = LoggerType.Employee.ToString();

                var logDTO = Mapper.Map<WdmItemLog>(log);

                var insertedLog = await _publishingContext.WdmItemLog.AddAsync(logDTO);
                var saved = await _publishingContext.SaveChangesAsync() > 0;
                //copy past coding
                if (saved)
                {
                    var cacheLogKey = $"{Constants.CacheKeyName.ItemLog}{insertedLog.Entity.WdmItem}";
                    List<WdmItemLog> cachedWdmItemLoglist = await _publishingContext.WdmItemLog
                        .CachedWhereAsync(w => w.WdmItem == insertedLog.Entity.WdmItem, cacheLogKey);

                    if (!await CachedRepository.Update(cacheLogKey, cachedWdmItemLoglist))
                    {
                        Serilog.Log.Logger.Warning($"Suspend action: Can't update cached value for wdm item:[{insertedLog.Entity.WdmItem}]");
                    }
                }

                // move the item folder into the published folder of the current member
            }
            else if (Handler != null)
            {
                await Handler.RunOperation(operation, item, log);
            }
            else
            {
                Log.Error($"Can't find any handler for operation:[{operation}]");
                return false;
            }
            return true;
        }
    }

    public class ResumeWdmItemHandler : WdmItemUpdatingHandler
    {
        public ResumeWdmItemHandler(IMapper mapper, PublishingContext publishingContext,
            GalleryClient.IGalleryOperationService galleryOperationService)
        {
            _publishingContext = publishingContext;
            _galleryOperationService = galleryOperationService;
            Mapper = mapper;
        }

        public override async Task<bool> RunOperation(PublishStatusType operation, WdmItemModel item, WdmItemLogModel log)
        {
            if (operation == PublishStatusType.Resumed)
            {
                // update wdm_item
                var cacheKey = $"{Constants.CacheKeyName.WdmItemKey}{item.WdmItemKey}";
                var itemDTO = await _publishingContext.WdmItem.CachedFirstOrDefaultAsync(f => f.WdmItemKey == item.WdmItemKey, cacheKey);
                if (itemDTO == null)
                {
                    Log.Error($"Can't find wdm item by:[{item.WdmItemKey}]");
                    return false;
                }

                if (itemDTO.PublishStatus != PublishStatusType.Suspended.ToString())
                {
                    Log.Error($"Previously, the status type should be 'Suspended', but now it is:[{item.PublishStatus}]");
                    return false;
                }

                Enum.TryParse(typeof(PublishStatusType), itemDTO.PublishStatus, true, out var currPublishStatus);
                item.StoragePath = itemDTO.StoragePath;
                item.WdmCategoryId = itemDTO.WdmCategoryId;
                await MoveItemFolderInNextStep(item, (PublishStatusType)currPublishStatus, PublishStatusType.Published);

                var now = DateTime.Now;
                var resumeDate = now.ToString("yyyyMMdd");
                itemDTO.PublishYyyymmdd = resumeDate;
                itemDTO.PublishStatus = PublishStatusType.Published.ToString();
                var updatedItem = _publishingContext.WdmItem.Update(itemDTO);
                var updated = await _publishingContext.SaveChangesAsync() > 0;
                if (updated)
                {
                    var keysUpdating = new List<string>();
                    keysUpdating.Add(cacheKey);
                    keysUpdating.Add($"{Constants.CacheKeyName.WdmItemStorePath}{item.StoragePath}");
                    if (!await CachedRepository.UpdateAll(keysUpdating, itemDTO))
                    {
                        Serilog.Log.Logger.Warning($"UpdateWdmItem: Not all keys were successfully updated for wdm item:[{item.WdmItemKey}]");
                    }
                }

                // insert log
                log.LogYyyymmdd = resumeDate;
                log.LogType = LogType.Publishing.ToString();
                log.LoggerType = LoggerType.Employee.ToString();

                var logDTO = Mapper.Map<WdmItemLog>(log);

                var insertedLog = await _publishingContext.WdmItemLog.AddAsync(logDTO);
                var saved = await _publishingContext.SaveChangesAsync() > 0;
                //copy past coding
                if (saved)
                {
                    var cacheLogKey = $"{Constants.CacheKeyName.ItemLog}{insertedLog.Entity.WdmItem}";
                    List<WdmItemLog> cachedWdmItemLoglist = await _publishingContext.WdmItemLog
                        .CachedWhereAsync(w => w.WdmItem == insertedLog.Entity.WdmItem, cacheLogKey);

                    if (!await CachedRepository.Update(cacheLogKey, cachedWdmItemLoglist))
                    {
                        Serilog.Log.Logger.Warning($"Resume action: Can't update cached value for wdm item:[{insertedLog.Entity.WdmItem}]");
                    }
                }

                // move the item folder into the published folder of the current member
            }
            else if (Handler != null)
            {
                await Handler.RunOperation(operation, item, log);
            }
            else
            {
                Log.Error($"Can't find any handler for operation:[{operation}]");
                return false;
            }
            return true;
        }
    }

    public class UnpublishWdmItemHandler : WdmItemUpdatingHandler
    {

        public UnpublishWdmItemHandler(IMapper mapper, PublishingContext publishingContext,
            GalleryClient.IGalleryOperationService galleryOperationService)
        {
            _publishingContext = publishingContext;
            _galleryOperationService = galleryOperationService;
            Mapper = mapper;
        }

        public override async Task<bool> RunOperation(PublishStatusType operation, WdmItemModel item, WdmItemLogModel log)
        {
            if (operation == PublishStatusType.Unpublished)
            {
                // update wdm_item
                var cacheKey = $"{Constants.CacheKeyName.WdmItemKey}{item.WdmItemKey}";
                var itemDTO = await _publishingContext.WdmItem.CachedFirstOrDefaultAsync(f => f.WdmItemKey == item.WdmItemKey, cacheKey);
                if (itemDTO == null)
                {
                    Log.Error($"Can't find wdm item by:[{item.WdmItemKey}]");
                    return false;
                }

                if (itemDTO.PublishStatus != PublishStatusType.Published.ToString())
                {
                    Log.Error($"Previously, the status type should be 'Published', but now it is:[{item.PublishStatus}]");
                    return false;
                }

                Enum.TryParse(typeof(PublishStatusType), itemDTO.PublishStatus, true, out var currPublishStatus);
                item.StoragePath = itemDTO.StoragePath;
                item.WdmCategoryId = itemDTO.WdmCategoryId;
                
                await MoveItemFolderInNextStep(item, (PublishStatusType)currPublishStatus, PublishStatusType.Unpublished);

                var now = DateTime.Now;
                var unpublishDate = now.ToString("yyyyMMdd");
                itemDTO.PublishYyyymmdd = unpublishDate;
                itemDTO.PublishStatus = PublishStatusType.Unpublished.ToString();
                var updatedItem = _publishingContext.WdmItem.Update(itemDTO);
                var updated = await _publishingContext.SaveChangesAsync() > 0;
                if (updated)
                {
                    var keysUpdating = new List<string>();
                    keysUpdating.Add(cacheKey);
                    keysUpdating.Add($"{Constants.CacheKeyName.WdmItemStorePath}{item.StoragePath}");
                    if (!await CachedRepository.UpdateAll(keysUpdating, itemDTO))
                    {
                        Serilog.Log.Logger.Warning($"UpdateWdmItem: Not all keys were successfully updated for wdm item:[{item.WdmItemKey}]");
                    }
                }

                // insert log
                log.LogYyyymmdd = unpublishDate;
                log.LogType = LogType.Publishing.ToString();
                log.LoggerType = LoggerType.Employee.ToString();

                var logDTO = Mapper.Map<WdmItemLog>(log);

                var insertedLog = await _publishingContext.WdmItemLog.AddAsync(logDTO);
                var saved = await _publishingContext.SaveChangesAsync() > 0;
                //copy past coding
                if (saved)
                {
                    var cacheLogKey = $"{Constants.CacheKeyName.ItemLog}{insertedLog.Entity.WdmItem}";
                    List<WdmItemLog> cachedWdmItemLoglist = await _publishingContext.WdmItemLog
                        .CachedWhereAsync(w => w.WdmItem == insertedLog.Entity.WdmItem, cacheLogKey);

                    if (!await CachedRepository.Update(cacheLogKey, cachedWdmItemLoglist))
                    {
                        Serilog.Log.Logger.Warning($"Unpublish action: Can't update cached value for wdm item:[{insertedLog.Entity.WdmItem}]");
                    }
                }

                // move the item folder into the published folder of the current member
            }
            else if (Handler != null)
            {
                await Handler.RunOperation(operation, item, log);
            }
            else
            {
                Log.Error($"Can't find any handler for operation:[{operation}]");
                return false;
            }
            return true;
        }
    }

    public class RequestWdmItemHandler : WdmItemUpdatingHandler
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private MemberModel MemberInfo => (MemberModel)_httpContextAccessor?.HttpContext.Items[
            _httpContextAccessor.HttpContext.Request.Headers["token"]];

        public RequestWdmItemHandler(IMapper mapper, PublishingContext publishingContext,
            GalleryClient.IGalleryOperationService galleryOperationService, 
            IHttpContextAccessor httpContextAccessor = null)
        {
            _publishingContext = publishingContext;
            _galleryOperationService = galleryOperationService;
            Mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
        }

        public override async Task<bool> RunOperation(PublishStatusType operation, WdmItemModel item, WdmItemLogModel log)
        {
            if (operation == PublishStatusType.Requested)
            {
                // update wdm_item
                var cacheKey = $"{Constants.CacheKeyName.WdmItemKey}{item.WdmItemKey}";
                var itemDTO = await _publishingContext.WdmItem.CachedFirstOrDefaultAsync(f => f.WdmItemKey == item.WdmItemKey, cacheKey);
                if (itemDTO == null)
                {
                    Log.Error($"Can't find wdm item by:[{item.WdmItemKey}]");
                    return false;
                }

                bool incorrectStatus = false;
                incorrectStatus = itemDTO.PublishStatus != PublishStatusType.Rejected.ToString();
                if (incorrectStatus)
                {
                    incorrectStatus = itemDTO.PublishStatus != PublishStatusType.Revoked.ToString();
                }
                if (incorrectStatus)
                {
                    incorrectStatus = itemDTO.PublishStatus != PublishStatusType.Unpublished.ToString();
                }
                if (incorrectStatus)
                {
                    Log.Error($"Previously, the status type should be 'Rejected' or 'Revoked' or 'Unpublished', but now it is:[{item.PublishStatus}]");
                    return false;
                }

                Enum.TryParse(typeof(PublishStatusType), itemDTO.PublishStatus, true, out var currPublishStatus);
                item.StoragePath = itemDTO.StoragePath;
                item.WdmCategoryId = itemDTO.WdmCategoryId;
                await MoveItemFolderInNextStep(item, (PublishStatusType)currPublishStatus, PublishStatusType.Requested);

                var now = DateTime.Now;
                var requestedDate = now.ToString("yyyyMMdd");

                itemDTO.PublishYyyymmdd = requestedDate;
                itemDTO.PublishStatus = PublishStatusType.Requested.ToString();
                itemDTO.WdmItemId = item.WdmItemId;
                itemDTO.ItemName = item.ItemName;
                itemDTO.Description = Helper.SanitizeHtml(item.Description);
                itemDTO.Price = item.Price;
                itemDTO.KeywordsText = item.KeywordsText;
                itemDTO.WdmCategoryId = item.WdmCategoryId;
                itemDTO.WdmSubCategoryId = item.WdmSubCategoryId;
                itemDTO.PublishStatusDisposition = item.PublishStatusDisposition;

                var updated = _publishingContext.WdmItem.Update(itemDTO);
                var saveUpdated = await _publishingContext.SaveChangesAsync() > 0;
                if (saveUpdated)
                {
                    var keysUpdating = new List<string>();
                    keysUpdating.Add(cacheKey);
                    keysUpdating.Add($"{Constants.CacheKeyName.WdmItemStorePath}{item.StoragePath}");
                    if (!await CachedRepository.UpdateAll(keysUpdating, itemDTO))
                    {
                        Serilog.Log.Logger.Warning($"UpdateWdmItem: Not all keys were successfully updated for wdm item:[{item.WdmItemKey}]");
                    }
                }

                // insert log
                log.LogYyyymmdd = requestedDate;
                log.LogType = LogType.Publishing.ToString();
                log.LoggerType = LoggerType.Member.ToString();

                var logDTO = Mapper.Map<WdmItemLog>(log);

                var insertedLog = await _publishingContext.WdmItemLog.AddAsync(logDTO);
                var saved = await _publishingContext.SaveChangesAsync() > 0;
                //copy past coding
                if (saved)
                {
                    var cacheLogKey = $"{Constants.CacheKeyName.ItemLog}{insertedLog.Entity.WdmItem}";
                    List<WdmItemLog> cachedWdmItemLoglist = await _publishingContext.WdmItemLog
                        .CachedWhereAsync(w => w.WdmItem == insertedLog.Entity.WdmItem, cacheLogKey);

                    if (!await CachedRepository.Update(cacheLogKey, cachedWdmItemLoglist))
                    {
                        Serilog.Log.Logger.Warning($"Request action: Can't update cached value for wdm item:[{insertedLog.Entity.WdmItem}]");
                    }
                }

                //
                // todo: needed removing when impelement functional
                // template hack - do approve operation too, because now hasn't Requested SubCategory tab on client side
                if (MemberInfo == null ||
                    MemberInfo.MemberKey != updated.Entity.Member &&
                    MemberInfo.EmployeeMemberFlg != "Yes")
                    return true;

                await MoveItemFolderInNextStep(item, PublishStatusType.Requested, PublishStatusType.Published);

                itemDTO.PublishStatus = PublishStatusType.Published.ToString();
                _publishingContext.WdmItem.Update(itemDTO);
                await _publishingContext.SaveChangesAsync();
                
                var wdmItemAutoApproveLog = new WdmItemLog
                {
                    WdmItem = log.WdmItem,
                    LogYyyymmdd = log.LogYyyymmdd,
                    LogType = LogType.Publishing.ToString(),
                    LoggerType = LoggerType.Member.ToString(),
                    LoggerId = MemberInfo.MemberKey.ToString(),
                    LogText = "Automatically setting the request status to the approved status for all immediate actions",
                    Price = item.Price
                };

                await _publishingContext.WdmItemLog.AddAsync(wdmItemAutoApproveLog);
                await _publishingContext.SaveChangesAsync();
            }
            else if (Handler != null)
            {
                await Handler.RunOperation(operation, item, log);
            }
            else
            {
                Log.Error($"Can't find any handler for operation:[{operation}]");
                return false;
            }
            return true;
        }
    }
}
