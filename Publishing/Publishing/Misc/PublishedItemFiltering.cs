using System;
using System.Linq;
using DesignClient;
using Microsoft.EntityFrameworkCore;
using Publishing.Repository.Context;
using Publishing.Repository.DTO;
using PublishingCommon.Enums;
using PublishingCommon.RequestModel;
using Serilog.Events;

namespace Publishing.Misc
{
    public abstract class PublishedItemFilteringHandler
    {
        protected PublishedItemFilteringHandler FilteringHandler;
        protected IProductService _productService;
        protected WdmResourcesClient.IWdmResourcesService _wdmResourcesService;
        protected PublishingContext _publishingContext;

        protected PublishedItemFilteringHandler()
        {
        }

        public void SetNextFilteringHandler(PublishedItemFilteringHandler filteringHandler)
        {
            FilteringHandler = filteringHandler;
        }

        public abstract IQueryable<WdmItem> GetFiltrationQuery(string sizeMatching, IQueryable<WdmItem> query, GetterPublishedRequest request);
    }

    public class NcrPublishedItemFilteringHandler : PublishedItemFilteringHandler
    {
        public NcrPublishedItemFilteringHandler(PublishingContext publishingContext)
        {
            _publishingContext = publishingContext;
        }

        public override IQueryable<WdmItem> GetFiltrationQuery(string sizeMatching, IQueryable<WdmItem> query,
            GetterPublishedRequest request)
        {
            // If NOT "Free Style" AND (Prod_Type+Prod_Type_Optn_Dtl record is found in WDM_Category <meaning NCR products>)
            if (request.FreeStyle 
                || (!request.ProdTypeOptnDtlKey.HasValue || request.ProdTypeOptnDtlKey.Value == 0)
                                  || string.IsNullOrEmpty(request.WdmCategoryId))
                return FilteringHandler.GetFiltrationQuery(sizeMatching, query, request);

            var category = _publishingContext.WdmCategory.FirstOrDefault(f => f.WdmCategoryId == request.WdmCategoryId);
            if (category == null)
                return FilteringHandler.GetFiltrationQuery(sizeMatching, query, request);

            if (category.ProdType != request.ProdType)
            {
                return FilteringHandler.GetFiltrationQuery(sizeMatching, query, request);
            }
            // if NCR product but not set Opnt in category for filtering
            if (!category.ProdTypeOptnDtl.HasValue)
            {
                // return 0 elements
                return query.Take(0);
            }
            // return a wdmItem only equal to the category parameters
            if (category.ProdTypeOptnDtl == request.ProdTypeOptnDtlKey)
            {
                return query.Where(w => w.ProdType == request.ProdType && w.ProdTypeOptnDtl == request.ProdTypeOptnDtlKey);
            }
            // else return 0 elements
            return query.Take(0);
        }
    }


    public class ExactProductPublishedItemFilteringHandler: PublishedItemFilteringHandler
    {
        public ExactProductPublishedItemFilteringHandler()
        {
        }

        public override IQueryable<WdmItem> GetFiltrationQuery(string sizeMatching, IQueryable<WdmItem> query, GetterPublishedRequest request)
        {
            if (sizeMatching == SizeMatchingType.ExactProduct.ToString())
            {
                if (request.ProdType.HasValue)
                    query = query.Where(w => w.ProdType == request.ProdType);

                if (!string.IsNullOrEmpty(request.SizeDimension))
                    query = query.Where(w => w.SizeDimension == request.SizeDimension);
            }
            else if (FilteringHandler != null)
            {
                return FilteringHandler.GetFiltrationQuery(sizeMatching, query, request);
            }
            
            return query;
        }
    }

    public class ExactSizePublishedItemFilteringHandler : PublishedItemFilteringHandler
    {
        public ExactSizePublishedItemFilteringHandler(IProductService productService)
        {
            _productService = productService;
        }

        public override IQueryable<WdmItem> GetFiltrationQuery(string sizeMatching, IQueryable<WdmItem> query, GetterPublishedRequest request)
        {
            if (sizeMatching == SizeMatchingType.ExactSize.ToString())
            {
                if (request.FreeStyle)
                {
                    if (request.SizeHeightDesign.HasValue)
                    {
                        query = query.Where(w =>
                            w.SizeHeightDesign.ToString() ==
                            String.Format("{0:0.0000}", request.SizeHeightDesign));
                    }
                    if (request.SizeWidthDesign.HasValue)
                    {
                        query = query.Where(w =>
                            w.SizeWidthDesign.ToString() ==
                            String.Format("{0:0.0000}", request.SizeWidthDesign));
                    }

                    return query;
                }
                
                // not free style
                if (string.IsNullOrEmpty(request.SizeDimension))
                    return query;

                var sizeDimension = _productService.GetSizeDimensionById(request.SizeDimension).Result;
                if (sizeDimension == null || string.IsNullOrEmpty(sizeDimension.SizeDimension))
                    return query;

                query = query.Where(w => w.SizeHeightDesign == sizeDimension.SizeHDesign);
                query = query.Where(w => w.SizeWidthDesign == sizeDimension.SizeWDesign);
            }
            else if (FilteringHandler != null)
            {
                return FilteringHandler.GetFiltrationQuery(sizeMatching, query, request);
            }

            return query;
        }
    }

    public class GenericSizePublishedItemFilteringHandler : PublishedItemFilteringHandler
    {
        public GenericSizePublishedItemFilteringHandler(WdmResourcesClient.IWdmResourcesService wdmResourcesService)
        {
            _wdmResourcesService = wdmResourcesService;
        }

        public override IQueryable<WdmItem> GetFiltrationQuery(string sizeMatching, IQueryable<WdmItem> query, GetterPublishedRequest request)
        {
            if (sizeMatching == SizeMatchingType.GenericSize.ToString())
            {
                Func<decimal?, decimal?, decimal, bool> validationBorderValue = (v, sv, p) =>
                {
                    if (!v.HasValue || !sv.HasValue)
                        return true;

                    var pctValue = (sv * p) / 100;
                    var lessBorderValue = sv - pctValue;
                    var moreBorderValue = sv + pctValue;

                    return v >= lessBorderValue && v <= moreBorderValue;
                };

                var settings = _wdmResourcesService.GetWdmSettings().Result;
                if (settings.TemplateFilterWidthHeightVariancePct.HasValue)
                {
                    query = query.Where(w => validationBorderValue(w.SizeHeightDesign.Value, request.SizeHeightDesign,
                        settings.TemplateFilterWidthHeightVariancePct.Value));
                    query = query.Where(w => validationBorderValue(w.SizeWidthDesign.Value, request.SizeWidthDesign,
                        settings.TemplateFilterWidthHeightVariancePct.Value));
                }
            }
            else if (FilteringHandler != null)
            {
                return FilteringHandler.GetFiltrationQuery(sizeMatching, query, request);
            }

            return query;
        }
    }
}
