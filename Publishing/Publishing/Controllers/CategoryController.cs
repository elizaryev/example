using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Publishing.BusinessLogic;
using PublishingCommon.Model;

namespace Publishing.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    [Route("api/Category")]
    public class CategoryController : Controller
    {
        private readonly ICategorySevice _categorySevice;

        public CategoryController(ICategorySevice categorySevice)
        {
            _categorySevice = categorySevice;
        }

        // GET: api/Category
        [HttpGet]
        public async Task<List<WdmCategoryModel>> Get()
        {
            return await _categorySevice.GetCategoryList();
        }

        [Route("reloadcache")]
        [HttpPost]
        public async Task<bool> ReloadCacheCategory()
        {
            return await _categorySevice.ReloadCacheCategory();
        }
    }

    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    [Route("api/subcategory")]
    public class SubcategoryController : Controller
    {
        private readonly ICategorySevice _categorySevice;

        public SubcategoryController(ICategorySevice categorySevice)
        {
            _categorySevice = categorySevice;
        }

        // GET: api/Category
        [HttpGet]
        public async Task<List<WdmSubCategoryModel>> Get([FromQuery]string wdmCategoryId)
        {
            return await _categorySevice.GetSubCategoryList(wdmCategoryId);
        }

        [HttpPost("create")]
        public async Task<int> Create([FromBody] WdmSubCategoryModel itemData)
        {
            return await _categorySevice.SaveSubCategory(itemData);
        }
    }
}
