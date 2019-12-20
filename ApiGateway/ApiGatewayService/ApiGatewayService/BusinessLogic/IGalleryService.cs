using System.Collections.Generic;
using System.Threading.Tasks;
using ApiGatewayCommon;
using DesignCommon.Model;
using GalleryCommon.Enum;
using GalleryCommon.Model;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace ApiGatewayService.BusinessLogic
{
    public interface IGalleryService
    {
        Task<IEnumerable<GalleryModel>> GetGalleries(GalleryType type = GalleryType.Private);

        Task<GalleryItem> GetGalleryItemByRepoHash(string hash, string galleryType);

        Task<IEnumerable<GalleryItem>> GetItems(string pathToItemOrGallery, int? start = null, int? take = null);

        Task<IEnumerable<ViewMediaImage>> GetGalleryItemViewMedia(string path, string type = WDMFileTypes.Screen, string galleryItemType = "");

        Task<IActionResult> GetGalleryItemGraphic(string hash);

        Task<IActionResult> GetDesignItemGraphic(string hash, string itemType = GalleryItemType.Graphic,
            string outputType = WDMFileTypes.Screen, JObject loginData = null);

        Task<ViewMediaImage> AddGalleryItemToDesign(string hash, string type, string designHash,
            bool useFilesystem = false, string generatedHash = "");
        Task<DesignModel> AddDesignToDesign(string hash, string designHash, int sideNumber = -1);

        Task<bool> DeleteItem(string hash);

        //Task<IEnumerable<ViewMediaImage>> UploadDesignItemGraphic(HttpRequest request);

        Task<GalleryItem> CreateFolder(string hash, string folderName);
        Task<bool> RenameFolder(string hash, string newName);
        Task<bool> DeleteFolder(string hash);
        Task<Result> SaveDesignToMyCloud(string sourceHash, string destinationMyCloudPath, string designName, string size, string data,
            string[] parserResultIds, bool force = false);
        Task<DesignParameterModel> ReloadDesignModel(string sourceHash, string destinationHash, int side = -1);
		(bool validOffset, bool hasOffset, int start, int take) ValidationOffsetParams(JObject data);
    }
}
