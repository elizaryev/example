using System.Collections.Generic;
using System.Threading.Tasks;
using WdmResourcesCommon.Model;

namespace ApiGatewayService.BusinessLogic
{
    public interface IWdmResourcesService
    {
        Task<List<MenuItemModel>> GetMenuItemList();

        Task<List<LanguageFontGroupFontModel>> GetFontGroupList(string siteID);
        Task<string> GetFontCss(string[] tfc);
        Task<WdmSettingModel> GetWdmSettings();
    }
}