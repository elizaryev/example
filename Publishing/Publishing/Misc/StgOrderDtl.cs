using System;
using System.Linq;
using System.Threading.Tasks;
using DesignCommon.Model;
using MemberCommon.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Internal;
using Microsoft.Extensions.Options;
using Publishing.Entities;
using Publishing.Repository.Context;
using PublishingCommon.Enums;

namespace Publishing.Misc
{
    public class StgOrderDtl: IStgOrderDtl
    {
        private readonly DesignClient.IProductService _productService;
        private readonly PublishingContext _publishingContext;
        private readonly PublishingServiceSettings _settings;

        public StgOrderDtl(PublishingContext publishingContext,
            IOptions<PublishingServiceSettings> publishingServiceSettings,
            DesignClient.IProductService productService)
        {
            _publishingContext = publishingContext;
            _productService = productService;
            _settings = publishingServiceSettings.Value;
        }

        public async Task<Repository.DTO.StgOrderDtl> CreateStgOrderDtl(string orderStage, string dtlType, int price, int optnPrice,
            ProdTypeOptnModel prodTypeOptn, ProdModel prodModel, MemberModel memberInfo, int orderQty, int printQty, int prodTypeKey,
            int currDtlLineNbr, string language)
        {
            Repository.DTO.StgOrderDtl stgOrderDtl = null;

            ProdModel multiProd = null;
            if (dtlType == OrderDtlType.MultiPageCover)
            {
                var multiProdList = await _productService.GetProd(prodTypeKey,
                        prodModel.MultiPageCoverSizeDimension, prodModel.MultiPageCoverMaterialStockAbbr, null, null);

                multiProd = multiProdList.FirstOrDefault(f => f.MultiPageType == "Cover");
            }
            else if (dtlType == OrderDtlType.MultiPagePage)
            {
                var multiProdList = await _productService.GetProd(prodTypeKey,
                    prodModel.MultiPagePageSizeDimension, prodModel.MultiPagePageMaterialStockAbbr, null, null);

                multiProd = multiProdList.FirstOrDefault(f => f.MultiPageType == "Page");
            }

            var stgOrderHdr =
                await _publishingContext.StgOrderHdr.FirstOrDefaultAsync(f => f.OrderId == memberInfo.UniqId);
            if (stgOrderHdr == null)
                return stgOrderDtl;
            
            int currDtlSubLineNbr = 1;
            stgOrderDtl = new Repository.DTO.StgOrderDtl
            {
                StgOrderHdrKey = stgOrderHdr.StgOrderHdrKey,
                DtlType = dtlType,
                DtlStatus = orderStage,
                OrderQty = orderQty,
                FtpStatus = "Open",
                ProofStatus = "Open",
                PrintQty = printQty,
                CurrencyDate = DateTime.Now,
                Currency = prodModel.Currency,
                CurrencyAbbr = prodModel.CurrencyAbbr,
                CurrencyVsUsdRate = prodModel.CurrencyVsUsdRate,
                CurrencyVsNtdRate = prodModel.CurrencyVsNtdRate
            };

            if (dtlType == OrderDtlType.Prod)
            {
                currDtlSubLineNbr = 1;

                stgOrderDtl.GraphicMethod = "WDM Design";
                stgOrderDtl.Description = prodModel.Description;

                stgOrderDtl.Prod = prodModel.ProdKey;
                stgOrderDtl.ProdType = prodModel.ProdType;
                stgOrderDtl.ZeroTaxFlg = prodModel.ZeroTaxFlg;
                stgOrderDtl.Price = price;
                stgOrderDtl.SizeName = prodModel.SizeName;
                stgOrderDtl.PrintSide = prodModel.PrintSide;
                stgOrderDtl.SizeUm = prodModel.SizeUm;
                stgOrderDtl.SizeDimension = prodModel.SizeDimension;
                stgOrderDtl.WeightUm = prodModel.WeightUm;
                stgOrderDtl.Language = language;

                var unitMeasure =
                    await _publishingContext.UnitMeasure.FirstOrDefaultAsync(f => f.UnitMeasureKey == prodModel.SizeUm);
                stgOrderDtl.SizeUmId = unitMeasure.UnitMeasureId;

                unitMeasure =
                    await _publishingContext.UnitMeasure.FirstOrDefaultAsync(f => f.UnitMeasureKey == prodModel.WeightUm);
                stgOrderDtl.WeightUmId = unitMeasure.UnitMeasureId;

                // ignore stgOrderDtl.Weight = await GetProdWeightByPrintQty(prodModel, printQty) * orderQty;
            }
            else if (dtlType == OrderDtlType.MultiPageCover)
            {
                currDtlSubLineNbr = 3;

                var mpDesignType = GetMPDesignTypeByDBValue(prodModel.MultiPageDesignType);
                var noFrontCover = prodModel.MultipageNoFrontCoverFlg == "Yes";
                var noBackCover = prodModel.MultipageNoBackCoverFlg == "Yes";
                var crossPageNoCoverBacksides = prodModel.MultipageNoCoverBacksidesFlg == "Yes";
                
                stgOrderDtl.PrintQty = GetCoverCount(mpDesignType, noFrontCover, noBackCover,
                    crossPageNoCoverBacksides);
            }
            else if (dtlType == OrderDtlType.MultiPagePage)
            {
                currDtlSubLineNbr = 4;

                var mpDesignType = GetMPDesignTypeByDBValue(prodModel.MultiPageDesignType);
                var noFrontCover = prodModel.MultipageNoFrontCoverFlg == "Yes";
                var noBackCover = prodModel.MultipageNoBackCoverFlg == "Yes";
                var crossPageNoCoverBacksides = prodModel.MultipageNoCoverBacksidesFlg == "Yes";

                stgOrderDtl.PrintQty = GetInnerPageCount(printQty, mpDesignType, noFrontCover, noBackCover,
                    crossPageNoCoverBacksides);
            }
            else
            {
                currDtlSubLineNbr++;
            }

            stgOrderDtl.DtlLineNbr = currDtlLineNbr;
            stgOrderDtl.DtlSubLineNbr = currDtlSubLineNbr;

            if (dtlType == OrderDtlType.ProdTypeOptnDtl)
            {
                var prodTypeOptnDtlList = prodTypeOptn.ProdTypeOptnDtl;
                if (prodTypeOptnDtlList.Any())
                {
                    var prodTypeOptnDtl = prodTypeOptnDtlList.First();
                    stgOrderDtl.Description = prodTypeOptnDtl?.Description;
                    stgOrderDtl.ProdTypeOptnDtl = prodTypeOptnDtl?.ProdTypeOptnDtlKey;
                    stgOrderDtl.ZeroTaxFlg = prodTypeOptnDtl?.ZeroTaxFlg;
                    stgOrderDtl.SizeName = prodTypeOptnDtl?.SizeName;
                }

                if (prodTypeOptn.ProdTypeOptnKey <= 0)
                {
                    var optnDtl = await _productService.GetProdTypeOptnDtlByKey(stgOrderDtl.ProdTypeOptnDtl.ToString());
                    if (optnDtl != null)
                    {
                        stgOrderDtl.ProdTypeOptn = optnDtl.ProdTypeOptnKey;
                    }
                }
                else
                    stgOrderDtl.ProdTypeOptn = prodTypeOptn.ProdTypeOptnKey;

                stgOrderDtl.Price = optnPrice;
            }
            else if ((dtlType == OrderDtlType.MultiPageCover || dtlType == OrderDtlType.MultiPagePage) && multiProd != null)
            {
                stgOrderDtl.Description = multiProd.Description;

                stgOrderDtl.Prod = multiProd.ProdKey;
                stgOrderDtl.ProdType = multiProd.ProdType;
                stgOrderDtl.Price = 0;
                stgOrderDtl.SizeDimension = multiProd.SizeName;
                stgOrderDtl.PrintSide = multiProd.PrintSide;
                stgOrderDtl.SizeUm = multiProd.SizeUm;
                var unitMeasure =
                    await _publishingContext.UnitMeasure.FirstOrDefaultAsync(f => f.UnitMeasureKey == multiProd.SizeUm);
                stgOrderDtl.SizeUmId = unitMeasure.UnitMeasureId;
                stgOrderDtl.SizeDimension = multiProd.SizeDimension;
            }

            // for cover and page not need calc sales amt
            if (dtlType != OrderDtlType.MultiPageCover && dtlType != OrderDtlType.MultiPagePage)
                stgOrderDtl.SalesAmt = stgOrderDtl.Price * orderQty;

            return stgOrderDtl;
        }

        private async Task<decimal> GetProdWeightByPrintQty(ProdModel prodModel, int printQty)
        {

            int indexQty = prodModel.OrderQtyList.Split(",").IndexOf(printQty.ToString());
            if(indexQty < 0)
                return 0;

            using (var command = _publishingContext.Database.GetDbConnection().CreateCommand())
            {
                var prefixIndexVal = indexQty < 10 ? "0" : "";
                command.CommandText = $"SELECT TOP 1 WEIGHT_QTY_{prefixIndexVal}{indexQty} FROM Prod  WHERE PROD = {prodModel.ProdKey}";
                _publishingContext.Database.OpenConnection();
                var weight = await command.ExecuteScalarAsync();
                decimal.TryParse(weight.ToString(), out var _weight);
                return _weight;
            }
        }

        public static int GetCoverCount(string mode, bool noFrontCover, bool noBackCover, bool crossPageNoCoverBacksides)
        {
            int numOfCovers = 4;
            int deltaPages = 2;

            if (noFrontCover)
            {
                numOfCovers -= deltaPages;
            }

            if (noBackCover)
            {
                numOfCovers -= deltaPages;
            }

            if (mode == MultiPageDesignTypes.CROSS_PAGE && crossPageNoCoverBacksides)
            {
                if (!noFrontCover && !noBackCover)
                {
                    numOfCovers -= deltaPages;
                }
            }

            return numOfCovers;
        }

        public static int GetInnerPageCount(int totalPageCount, string mode, bool noFrontCover, bool noBackCover, bool crossPageNoCoverBacksides)
        {
            int numOfInnerPages = totalPageCount - 4;
            int deltaPages = 2;

            if (mode == MultiPageDesignTypes.DESIGN_SET)
            {
                return totalPageCount;
            }

            if (noFrontCover)
            {
                numOfInnerPages += deltaPages;
            }

            if (noBackCover)
            {
                numOfInnerPages += deltaPages;
            }

            if (mode == MultiPageDesignTypes.CROSS_PAGE && crossPageNoCoverBacksides)
                numOfInnerPages += deltaPages;

            return numOfInnerPages;

        }

        public static string GetMPDesignTypeByDBValue(string mpDesignType)
        {
            if (mpDesignType == MultiPageDesignTypes.CROSS_PAGE_DB)
            {
                return MultiPageDesignTypes.CROSS_PAGE;
            }
            else if (mpDesignType == MultiPageDesignTypes.DESIGN_SET_DB)
            {
                return MultiPageDesignTypes.DESIGN_SET;
            }
            else if (mpDesignType == MultiPageDesignTypes.SINGLE_PAGE_DB)
            {
                return MultiPageDesignTypes.SINGLE_PAGE;
            }
            return "";
        }
    }
}
