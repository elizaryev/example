using System.Collections.Generic;
using System.Threading.Tasks;
using PublishingCommon.Model;

namespace PublishingClient
{
    public interface ICategorySevice
    {
        Task<List<WdmCategoryModel>> GetCategoryList();
        Task<List<WdmSubCategoryModel>> GetSubCategoryList(string wdmCategoryId);
        Task<int> SaveSubCategory(WdmSubCategoryModel subcategory);
    }
}
