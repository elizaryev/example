using System.Collections.Generic;
using System.Threading.Tasks;
using ApiGatewayCommon;
using ApiGatewayService.Entities;
using DesignCommon.Model;
using GalleryCommon.Enum;
using GalleryCommon.Model;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;

namespace ApiGatewayService.BusinessLogic
{
    public class GalleryService: IGalleryService
    {
        private readonly GalleryClient.IGalleryService _galleryService;
        private readonly GalleryClient.IGalleryOperationService _galleryOperationService;
        private readonly int _YPMinDefaultMinutesSessionTimeout;
        private readonly IGatewayService _gatewayService;

        public GalleryService(GalleryClient.IGalleryService galleryService, GalleryClient.IGalleryOperationService galleryOperationService,
            IOptions<TokenManagerServiceSettings> tokenManagerServiceSettings, IGatewayService gatewayService)
        {
            _galleryService = galleryService;
            _galleryOperationService = galleryOperationService;
            _gatewayService = gatewayService;

            if (!int.TryParse(tokenManagerServiceSettings.Value.YPMinDefaultMinutesSessionTimeout,
                    out _YPMinDefaultMinutesSessionTimeout) || _YPMinDefaultMinutesSessionTimeout == 0)
            {
                _YPMinDefaultMinutesSessionTimeout = 40; // by default set 40 minutes if some error when parse config value
            }
        }

        public async Task<IEnumerable<GalleryModel>> GetGalleries(GalleryType type = GalleryType.Private)
        {
            return await _galleryService.GetGalleries(type);
        }

        public async Task<GalleryItem> GetGalleryItemByRepoHash(string hash, string galleryType)
        {
            return await _galleryService.GetGalleryItemByRepoHash(hash, galleryType);
        }

        public async Task<IEnumerable<GalleryItem>> GetItems(string pathToItemOrGallery, int? start = null, int? take = null)
        {
            return await _galleryService.GetItems(pathToItemOrGallery, start, take);
        }

        public async Task<IEnumerable<ViewMediaImage>> GetGalleryItemViewMedia(string path, string type = WDMFileTypes.Screen, string galleryItemType = "")
        {
            return await _galleryService.GetGalleryItemViewMedia(path, type, galleryItemType);
        }

        public async Task<IActionResult> GetGalleryItemGraphic(string hash)
        {
            return await _galleryService.GetGalleryItemGraphic(hash);
        }

        public async Task<IActionResult> GetDesignItemGraphic(string hash, string itemType = GalleryItemType.Graphic,
            string outputType = WDMFileTypes.Screen, JObject loginData = null)
        {
            var token = "";
            if (loginData != null)
            {
                //Login and generate token
                token = await _gatewayService.GetTokenByLoginParameters(loginData, _YPMinDefaultMinutesSessionTimeout );
            }

            return await _galleryService.GetDesignItemGraphic(hash, itemType, outputType, token);
        }

        public async Task<ViewMediaImage> AddGalleryItemToDesign(string hash, string type, string designHash,
            bool useFilesystem = false, string generatedHash = "")
        {
            return await _galleryOperationService.AddGalleryItemToDesign(hash, type, designHash, useFilesystem,
                generatedHash);
        }

        public async Task<DesignModel> AddDesignToDesign(string hash, string designHash, int sideNumber = -1)
        {
            return await _galleryOperationService.AddDesignToDesign(hash, designHash, sideNumber);
        }

        public async Task<bool> DeleteItem(string hash)
        {
            return await _galleryOperationService.DeleteItem(hash);
        }
        //public async Task<IEnumerable<ViewMediaImage>> UploadDesignItemGraphic(HttpRequest request, )
        //{
        //    var requestMessage = request.ToHttpRequestMessage();
        //    request.ToHttpRequestMessage()
        //    return await _galleryService.UploadDesignItemGraphic();
        //}

        public async Task<GalleryItem> CreateFolder(string hash, string folderName)
        {
            return await _galleryOperationService.CreateFolder(hash, folderName);
        }

        public async Task<bool> RenameFolder(string hash, string newName)
        {
            return await _galleryOperationService.RenameFolder(hash, newName);
        }

        public async Task<bool> DeleteFolder(string hash)
        {
            return await _galleryOperationService.DeleteFolder(hash);
        }

        public async Task<Result> SaveDesignToMyCloud(string sourceHash, string destinationMyCloudPath,
            string designName, string size, string data, string[] parserResultIds, bool force = false)
        {
            var callResult =  await _galleryOperationService.SaveDesignToMyCloud(sourceHash, destinationMyCloudPath, designName, size,
                data, parserResultIds, force);
            return new Result(callResult.Code, callResult.Message, callResult.Data);
        }

        public async Task<DesignParameterModel> ReloadDesignModel(string sourceHash, string destinationHash,
            int side = -1)
        {
            return await _galleryOperationService.ReloadDesignModel(sourceHash, destinationHash, side);
        }


		public (bool validOffset, bool hasOffset, int start, int take) ValidationOffsetParams(JObject data)
        {
            bool validOffset = false;
            bool hasOffset = false;
            int take = 0;
            int start = 0;
            if (data != null && data.Count > 0 && data.ContainsKey("start"))
            {
                hasOffset = true;
                int.TryParse(data["start"].ToObject<string>(), out start);
                validOffset = (start >= 0);
                if (!validOffset) return (validOffset: false, hasOffset: true, start, take);

                if (data.ContainsKey("take"))
                {
                    int.TryParse(data["take"].ToObject<string>(), out take);
                    validOffset = (take > 0);
                }
                else
                {
                    validOffset = false;
                }
            }

            return (validOffset, hasOffset, start, take);
        }
    }
}
