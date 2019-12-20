using System.Collections.Generic;
using System.Threading.Tasks;
using PublishingCommon.Model;

namespace Publishing.BusinessLogic
{
    public interface ICategorySevice
    {
        Task<bool> ReloadCacheCategory();
        Task<List<WdmCategoryModel>> GetCategoryList();
        Task<List<WdmSubCategoryModel>> GetSubCategoryList(string wdmCategoryId);
        Task<int> SaveSubCategory(WdmSubCategoryModel subcategory);
    }
}
