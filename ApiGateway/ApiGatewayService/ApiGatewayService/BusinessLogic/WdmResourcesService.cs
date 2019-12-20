using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis.CSharp;
using WdmResourcesCommon.Model;

namespace ApiGatewayService.BusinessLogic
{
    public class WdmResourcesService : IWdmResourcesService
    {
        private readonly WdmResourcesClient.IWdmResourcesService _wdmResourcesService;

        public WdmResourcesService(WdmResourcesClient.IWdmResourcesService wdmResourcesService)
        {
            _wdmResourcesService = wdmResourcesService;
        }

        public async Task<List<LanguageFontGroupFontModel>> GetFontGroupList(string siteID)
        {
            return await _wdmResourcesService.GetFontGroupList(siteID);
        }

        public async Task<string> GetFontCss(string[] tfc)
        {
            return await _wdmResourcesService.GetFontCss(tfc);
        }

        public async Task<List<MenuItemModel>> GetMenuItemList()
        {
            return await _wdmResourcesService.GetMenuItemList();
        }

        public async Task<WdmSettingModel> GetWdmSettings()
        {
            return await _wdmResourcesService.GetWdmSettings();
        }
    }
}
