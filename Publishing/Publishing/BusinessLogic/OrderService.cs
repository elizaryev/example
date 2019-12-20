using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using DesignClient;
using DesignCommon.Model;
using EnsureThat;
using GalleryClient;
using GalleryCommon.Model;
using MemberCommon.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using ParserClient.Model;
using Publishing.Entities;
using Publishing.Repository.Context;
using Publishing.Repository.DTO;
using PublishingCommon.Enums;
using PublishingCommon.Model;
using SymbolicLinkSupport;
using Utils;
using Utils.Entities;
using Utils.Helper;


namespace Publishing.BusinessLogic
{
    public class OrderService: IOrderService
    {
        private readonly PublishingContext _publishingContext;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly PublishingServiceSettings _settings;
        private readonly Misc.IStgOrderDtl _stgOrderDtl;
        private readonly IProductService _productService;
        private readonly IDesignService _designService;
        private readonly IGalleryOperationService _gos;
        private readonly IMapper _mapper;
        private readonly DesignClient.IDesignService _designParameterService;

        private MemberModel MemberInfo => (MemberModel)_httpContextAccessor.HttpContext.Items[
            _httpContextAccessor.HttpContext.Request.Headers["token"]];

        private bool IsMember => MemberInfo != null;
        private readonly WDMPathResolverSettings _pathResolverServiceSettings;
        private WDMPathResolver Resolver => new WDMPathResolver(_pathResolverServiceSettings);

        public OrderService(PublishingContext publishingContext,
            IMapper mapper,
            IOptions<PublishingServiceSettings> publishingServiceSettings,
            IOptions<WDMPathResolverSettings> pathResolverServiceSettings,
            IHttpContextAccessor httpContextAccessor,
            IProductService productService,
            IDesignService designService,
            IGalleryOperationService gos,
            DesignClient.IDesignService designParameterService,
            Misc.IStgOrderDtl stgOrderDtl)
        {
            _publishingContext = publishingContext;
            _httpContextAccessor = httpContextAccessor;
            _settings = publishingServiceSettings.Value;
            _pathResolverServiceSettings = pathResolverServiceSettings.Value;
            _stgOrderDtl = stgOrderDtl;
            _productService = productService;
            _designService = designService;
            _gos = gos;
            _mapper = mapper;
            _designParameterService = designParameterService;
        }

        public async Task<int> GetCountStgOrderDtl()
        {
            Ensure.Any.IsNotNull<MemberModel>(MemberInfo);
            string uniqIdMember = Helper.GetUniqIdMember(MemberInfo.MemberKey);
            return await GetCountStgOrderDtlInternal(uniqIdMember);
        }

        private async Task<int> GetCountStgOrderDtlInternal(string cartOrderId)
        {
            var orderHdr = await _publishingContext.StgOrderHdr.FirstOrDefaultAsync(f => f.OrderId == cartOrderId);
            if (orderHdr == null)
                return 0;

            var orderDltList = await _publishingContext.StgOrderDtl
                .Where(w => w.StgOrderHdrKey == orderHdr.StgOrderHdrKey && w.DtlStatus == "Cart" && w.DtlType == "Prod")
                .ToListAsync();
            return orderDltList.Count;
        }

        public async Task<(DesignSpecModel designSpecModel, int price, int optnPrice, Dictionary<string, string> additionalParamsDesignSpec)> 
            GetMyCartItemDataByDesignHash(string designHash)
        {
            var designParamsModel = await _designParameterService.GetByDesignName(designHash, true);
            int.TryParse(designParamsModel.OriginalStgOrderDtl, out var stgOrdDtlProductKey);

            var product = await _publishingContext.StgOrderDtl.FirstOrDefaultAsync(f => f.StgOrderDtlKey == stgOrdDtlProductKey);
            if (product == null)
            {
                return (null, 0, 0, null);
            }

            // other dtl items of mycart item
            var dtlItems = await _publishingContext.StgOrderDtl.Where(w => w.StgOrderHdrKey == product.StgOrderHdrKey
                                                      && w.DtlLineNbr == product.DtlLineNbr
                                                      && w.StgOrderDtlKey != product.StgOrderDtlKey).ToListAsync();

            var prodTypeList = await _productService.GetProdType();
            var prodType = prodTypeList.FirstOrDefault(f => f.ProdTypeKey == product.ProdType);

            var prod = await _productService.GetProdByKey(product.Prod.Value);

            // set optn dtl
            Dictionary<string, string> prodTypeOptns = new Dictionary<string, string>();
            var dtlOptn = dtlItems.FirstOrDefault(f => f.DtlType == "Prod_Type_Optn_Dtl");
            if (dtlOptn != null)
            {
                var optnDtl = await _productService.GetProdTypeOptnDtlByKey(dtlOptn.ProdTypeOptnDtl.ToString());
                if (optnDtl != null)
                {
                    prodTypeOptns.Add(optnDtl.ProdTypeOptnId, optnDtl.ProdTypeOptnDtlAbbr);
                }
            }

            // update parameters.json
            designParamsModel.SideCount = (uint)(product.PrintSide == "Single" ? 1 : 2);
            designParamsModel.PageCount = (uint)product.PrintQty;
            designParamsModel.ProdTypeOptns = prodTypeOptns;
            designParamsModel.ProdId = prod.ProdId;
            await _designParameterService.SaveDesignParameters(designHash, designParamsModel, false);

            // get design Spec
            var designSpec = await _productService.GetDesignSpecModel(prodType.ProdTypeId, product.SizeDimension,
                new DesignSpecRequestParams()
                    {ProdTypeOptns = prodTypeOptns}, prod.ProdId);

            var additionalParamsDesignSpec = new Dictionary<string, string>();
            additionalParamsDesignSpec.Add("mode", "Edit");
            additionalParamsDesignSpec.Add("orderQty", product.OrderQty.ToString());
            additionalParamsDesignSpec.Add("pageQty", product.PrintQty.ToString());
            additionalParamsDesignSpec.Add("sideCount", product.PrintSide == "Single" ? "1" : "2");

            return (designSpec, (int)product.SalesAmt.Value, dtlOptn != null ? (int)dtlOptn.SalesAmt.Value : 0,
                additionalParamsDesignSpec);
        }

        public async Task<(bool result, string error, string originalType)> ProcessMyCartData(string sourceHash, int price, int optnPrice,
            ProdTypeOptnModel prodTypeOptn, ProdModel prodModel, int orderQty, int printQty, 
            int prodTypeKey, string prodTypeId,
            bool hasCoverMaterial, bool hasPageMaterial, string jsonDesignParams = "")
        {
            if (!IsMember)
                return (false, "Order.MyCart.MemberDoesntExists", string.Empty);

            #region ensure block
            Ensure.That(sourceHash).IsNotNullOrEmpty();
            Ensure.Any.IsNotNull<ProdModel>(prodModel);
            #endregion ensure block

            var prodSideCount = prodModel.PrintSide == "Single" ? 1 : 2;
            // check price
            var resultValidationPrice = await CheckMyCartPrice(price, optnPrice, prodTypeOptn, prodModel, orderQty, printQty, prodTypeKey, hasCoverMaterial, hasPageMaterial, prodSideCount);
            if (!resultValidationPrice.result)
                return (false, resultValidationPrice.error, string.Empty);

            var designParamsModel = await _designService.GetByDesignName(sourceHash, true);
            var sourcePath = Resolver.GetPathByHash(sourceHash, IsMember);
            
            // check content files
            var myCartData = CheckMyCartContent(prodModel, hasCoverMaterial, hasPageMaterial, sourcePath, designParamsModel);
            if (!myCartData.result)
                return (false, myCartData.error, string.Empty);

            // generate back and font png
            await GenerateParserPreviews(designParamsModel, sourcePath);
            
            var resultStgOrdDtl = await DoActionForStgOrdDtl(sourceHash, price, optnPrice, prodTypeOptn, prodModel,
                orderQty, printQty, prodTypeKey, hasCoverMaterial, hasPageMaterial, designParamsModel);
            if (!resultStgOrdDtl.result)
            {
                return (false, resultStgOrdDtl.error, string.Empty);
            }

            #region create symbolink link
            // to SymbolicLink folder
            if (!Directory.Exists(Path.Combine(_settings.LCPCartPath, MemberInfo.UniqId)))
            {
                Directory.CreateDirectory(Path.Combine(_settings.LCPCartPath, MemberInfo.UniqId));
            }

            // exmpl: ..\LCP_Cart\MBR000139368\1950
            var myCartFolder = Path.Combine(_settings.LCPCartPath, MemberInfo.UniqId, resultStgOrdDtl.stgOrderDtlKey);

            DirectoryInfo di = new DirectoryInfo(myCartFolder);
            // get target ling
            var destinationExists = di.Exists && di.IsSymbolicLinkShell();

            string hash;
            // if edit prev stg ord dtl - then must ignore it
            // just cope from session to prev store folder
            if (designParamsModel.OriginalType == "MyCart")
            {
                hash = designParamsModel.OriginalDesignHash;
            }
            else
            {
                if (destinationExists)
                {
                    // Overwrite existing junction
                    hash = di.GetSymbolicLinkTargetShell();
                    hash = hash.Substring(hash.LastIndexOf('\\') + 1);
                }
                else
                {
                    hash = ShortGuid.NewGuid().Value;
                }
            }
            
            var destinationRepoPath = Resolver.GetPathByHash(_settings.MemberDesignRepository + "/" + hash, IsMember);
            //Create new symlink
            if (!destinationExists)
            {
                var diDestination = new DirectoryInfo(destinationRepoPath);
                diDestination.Create();
                diDestination.Refresh();
                try
                {
                    diDestination.CreateSymbolicLinkShell(myCartFolder);
                }
                catch(Exception ex)
                {
                    Serilog.Log.Logger.Error(ex, "The Brown Magic: SymlinkCreationError ");
                    return (false, "Order.MyCart.SymlinkCreationError", string.Empty);
                }
            }
            else
            {
                //Clear existing repo folder
                if (Directory.Exists(destinationRepoPath))
                    FileSystemUtil.RemoveDirectoryRecursive(destinationRepoPath);
                // re-create original folder
                var diDestination = new DirectoryInfo(destinationRepoPath);
                diDestination.Create();
                diDestination.Refresh();
            }
            #endregion create symbolink link

            designParamsModel.DesignModel.Uid = _settings.MemberDesignRepository + "/" + hash;
            designParamsModel.DesignModel.Name = resultStgOrdDtl.stgOrderDtlKey;
            DesignCommon.Helper.CopyDesignFiles(sourcePath, destinationRepoPath, designParamsModel.DesignModel, WDMFileTypes.ViewMediaExtensions);

            File.WriteAllText(Path.Combine(destinationRepoPath, DesignFolder.DesignParametersFile),JsonConvert.SerializeObject(designParamsModel));

            // remove auto save
            await _designService.RemoveAutoSave(sourceHash);

            return (true, string.Empty, designParamsModel.OriginalType);
        }

        private async Task<(bool result, string error, string stgOrderDtlKey)> DoActionForStgOrdDtl(string sourceHash, int price, int optnPrice, 
            ProdTypeOptnModel prodTypeOptn, ProdModel prodModel, int orderQty, int printQty, int prodTypeKey, bool hasCoverMaterial, 
            bool hasPageMaterial, DesignParameterModel designParamsModel)
        {
            string stgOrderDtlKey;
            if (string.IsNullOrEmpty(designParamsModel.OriginalDesignHash))
            {
                var createdResult = await CreateStgOrderDtl(sourceHash, price, optnPrice, prodTypeOptn, prodModel, orderQty,
                    printQty, prodTypeKey,
                    hasCoverMaterial, hasPageMaterial);
                var stgOrderDtl = createdResult.stgOrderDtl;
                if (stgOrderDtl == null)
                    return (false, createdResult.error, string.Empty);

                stgOrderDtlKey = stgOrderDtl.StgOrderDtlKey.ToString();
            }
            else
            {
                stgOrderDtlKey = designParamsModel.OriginalStgOrderDtl;

                // if have prev stg ord dtl - then must update it
                var updatedResult = await UpdateStgOrderDtl(int.Parse(stgOrderDtlKey), price, optnPrice, prodTypeOptn, prodModel, orderQty,
                    printQty, hasCoverMaterial, hasPageMaterial);
                if (!updatedResult.result)
                    return (false, updatedResult.error, string.Empty);
            }

            return (true, string.Empty, stgOrderDtlKey);
        }

        private async Task GenerateParserPreviews(DesignParameterModel designParamsModel, string sourcePath)
        {
            var designWidth = 0;
            var designHeight = 0;
            try
            {
                var designModel = designParamsModel.DesignModel;
                if (designModel.Pages.Any())
                {
                    designWidth = (int) designModel.Pages.First().Width;
                    designHeight = (int) designModel.Pages.First().Height;
                }
            }
            catch (Exception ex)
            {
                Serilog.Log.Logger.Error(ex, "The Brown Magic: can't set designModel params!");
            }

            await _gos.GenerateParserPreviews(designParamsModel, new Size {Width = designWidth, Height = designHeight},
                sourcePath, null);
        }

        private async Task<(bool result, string error)> CheckMyCartPrice(int price, int optnPrice, ProdTypeOptnModel prodTypeOptn, ProdModel prodModel,
            int orderQty, int printQty, int prodTypeKey, bool hasCoverMaterial, bool hasPageMaterial, int prodSideCount)
        {
            if (hasCoverMaterial || hasPageMaterial)
            {
                var multiPrice = await _productService.CalculateMultiPagePrice(new MultiPriceRequest
                {
                    ProdData = prodModel,
                    OptnDtlData = prodTypeOptn?.ProdTypeOptnDtl.FirstOrDefault(),
                    OrderQty = orderQty,
                    PageQty = printQty
                });

                if (multiPrice.price != price || multiPrice.optnPrice != optnPrice)
                {
                    return (false, "Order.MyCart.MultiPriceValues");
                }
            }
            else
            {
                var singlePrice = await _productService.CalculationSinglePriceValues(new SinglePriceRequest
                {
                    Material = prodModel.MaterialStock.MaterialStockAbbr,
                    ProdTypeKey = prodTypeKey.ToString(),
                    ProdTypeOptnDtlKey = prodTypeOptn?.ProdTypeOptnDtl.FirstOrDefault()?.ProdTypeOptnDtlKey.ToString(),
                    Qty = printQty.ToString(),
                    SideCount = prodSideCount.ToString(),
                    SizeDimension = prodModel.SizeDimension
                });

                if (singlePrice.price != price || singlePrice.optnPrice != optnPrice)
                {
                    return (false, "Order.MyCart.SinglePriceValues");
                }
            }

            return (true, string.Empty);
        }

        private static (bool result, string error) CheckMyCartContent(ProdModel prodModel, bool hasCoverMaterial,
            bool hasPageMaterial, string sourcePath, DesignParameterModel dsm)
        {
            // check side count prodModel and parameters json
            var prodSideCount = prodModel.PrintSide == "Single" ? 1 : 2;
            if (prodSideCount != dsm.SideCount)
            {
                return (false, "Order.MyCart.SideCountDoesntMatch");
            }

            // multi product
            if (hasCoverMaterial || hasPageMaterial)
            {
                var wdmDirs = Directory.EnumerateDirectories(sourcePath);
                if(!wdmDirs.Any())
                    return (false, "Order.MyCart.WdmFolder");

                foreach (var wdmDir in wdmDirs)
                {
                    var checkResult = CheckWdmContent(prodModel, wdmDir, dsm);
                    if (!checkResult.result)
                    {
                        return checkResult;
                    }
                }
            }
            else
            {
                return CheckWdmContent(prodModel, sourcePath, dsm);
            }

            return (true, string.Empty);
        }

        private static (bool result, string error) CheckWdmContent(ProdModel prodModel, string sourcePath, DesignParameterModel dsm)
        {
            if (!Directory.Exists($"{sourcePath}\\wdm"))
            {
                return (false, "Order.MyCart.WdmFolder");
            }

            var contentFiles = Directory.EnumerateFiles($"{sourcePath}\\wdm").ToList();
            if (!contentFiles.Any())
            {
                return (false, "Order.MyCart.WdmEmptyContents");
            }

            // if design.json not equal count fils in wdm folder
            foreach (var page in dsm.DesignModel.Pages)
                foreach (var canvas in page.Canvases)
                    foreach (var layer in canvas.Layers)
                        if (contentFiles.Contains(((dynamic)layer).url.Value))
                            return (false, "Order.MyCart.WdmNotEqualsContents");

            return (true, string.Empty);
        }
        
        private async Task<(StgOrderDtl stgOrderDtl, string error)> CreateStgOrderDtl(string sourceHash, int price, int optnPrice, 
            ProdTypeOptnModel prodTypeOptn, ProdModel prodModel, int orderQty, int printQty, int prodTypeKey, 
            bool hasCoverMaterial, bool hasPageMaterial)
        {
            var orderHdr = await _publishingContext.StgOrderHdr.FirstOrDefaultAsync(f => f.OrderId == MemberInfo.UniqId);
            if (orderHdr == null)
            {
                var tempararyOrderId = sourceHash.Split('/').Last();
                orderHdr = await _publishingContext.StgOrderHdr.FirstOrDefaultAsync(f => f.OrderId == tempararyOrderId);
                if (orderHdr != null)
                {
                    SqlParameter[] Params = new SqlParameter[4];
                    Params[0] = new SqlParameter("p_StgOrderHdrPKey", SqlDbType.Int);
                    Params[0].Direction = ParameterDirection.Input;
                    Params[0].Value = orderHdr.StgOrderHdrKey;
                    Params[1] = new SqlParameter("p_CartOrderId", SqlDbType.VarChar);
                    Params[1].Direction = ParameterDirection.Input;
                    Params[1].Value = MemberInfo.UniqId;
                    Params[2] = new SqlParameter("p_EditedCartStgOrderDtl", SqlDbType.Int);
                    Params[2].Direction = ParameterDirection.Input;
                    Params[2].Value = 0;
                    Params[3] = new SqlParameter("p_StgOrderDtlPKey", SqlDbType.Int);
                    Params[3].Direction = ParameterDirection.Output;
                    Params[3].Value = 0;

                    var result = await _publishingContext.Database.ExecuteSqlCommandAsync("dbo.up_Order_AcceptPreCartStgOrderDtl @p_StgOrderHdrPKey, @p_CartOrderId, @p_EditedCartStgOrderDtl, @p_StgOrderDtlPKey OUT", Params);
                    orderHdr = await _publishingContext.StgOrderHdr.FirstOrDefaultAsync(f => f.OrderId == MemberInfo.UniqId);
                }
                else
                {
                    // create new item
                    var newStgOrderHdr = new StgOrderHdr
                    {
                        OrderId = MemberInfo.UniqId,
                        OrderStatus = "Cart",
                        GraphicMethod = "WDM Design",
                        Currency = prodModel.Currency,
                        CurrencyAbbr = prodModel.CurrencyAbbr,
                        CurrencyVsUsdRate = prodModel.CurrencyVsUsdRate,
                        CurrencyVsNtdRate = prodModel.CurrencyVsNtdRate,
                        ShipCountry = 50140, // magic value
                        ShipCountryName = "Taiwan (ROC)" //todo: mb in future it is will be and USA too - change it
                    };

                    var createdStgOrdHdr = await _publishingContext.StgOrderHdr.AddAsync(newStgOrderHdr);
                    var saved = await _publishingContext.SaveChangesAsync();
                    if (saved <= 0)
                    {
                        return (null, "Order.MyCart.FindOrderHdr");
                    }

                    orderHdr = createdStgOrdHdr.Entity;
                }
            }

            int currDtlLineNbr = 0;
            var lastStgOrderDtl = await _publishingContext.StgOrderDtl.OrderBy(o => o.DtlLineNbr)
                .LastOrDefaultAsync(l => l.StgOrderHdrKey == orderHdr.StgOrderHdrKey);
            if (lastStgOrderDtl != null && lastStgOrderDtl.DtlLineNbr.HasValue)
            {
                currDtlLineNbr = (lastStgOrderDtl.DtlLineNbr.Value + 1);
            }
            else
            {
                currDtlLineNbr = 1;
            }

            var stgOrderDtl = await _stgOrderDtl.CreateStgOrderDtl("Cart", OrderDtlType.Prod, price, optnPrice,
                prodTypeOptn, prodModel, MemberInfo, orderQty, printQty, prodTypeKey, currDtlLineNbr, _settings.Language);
            var createdStgOrderDtl = await _publishingContext.StgOrderDtl.AddAsync(stgOrderDtl);

            if (prodTypeOptn != null)
            {
                // create order dtl for optns
                var stgOrderOptnsDtl = await _stgOrderDtl.CreateStgOrderDtl("Cart", OrderDtlType.ProdTypeOptnDtl, price,
                    optnPrice, prodTypeOptn, prodModel, MemberInfo, orderQty, printQty, prodTypeKey, currDtlLineNbr,
                    _settings.Language);
                await _publishingContext.StgOrderDtl.AddAsync(stgOrderOptnsDtl);
            }
            if (hasCoverMaterial)
            {
                // create order dtl for cover
                var stgOrderCoverDtl = await _stgOrderDtl.CreateStgOrderDtl("Cart", OrderDtlType.MultiPageCover, price,
                    optnPrice, prodTypeOptn, prodModel, MemberInfo, orderQty, printQty, prodTypeKey, currDtlLineNbr, 
                    _settings.Language);
                await _publishingContext.StgOrderDtl.AddAsync(stgOrderCoverDtl);
            }
            if (hasPageMaterial)
            {
                // create order dtl for page
                var stgOrderPageDtl = await _stgOrderDtl.CreateStgOrderDtl("Cart", OrderDtlType.MultiPagePage, price,
                    optnPrice, prodTypeOptn, prodModel, MemberInfo, orderQty, printQty, prodTypeKey, currDtlLineNbr, 
                    _settings.Language);
                await _publishingContext.StgOrderDtl.AddAsync(stgOrderPageDtl);
            }

            // todo: mb needed add validation to the result of all operations and rollback previous operations
            var savedResult = await _publishingContext.SaveChangesAsync();
            if (savedResult <= 0 || !createdStgOrderDtl.Entity.StgOrderDtlKey.HasValue)
                return (null, "Order.MyCart.CreateOrderDtl");

            return (createdStgOrderDtl.Entity, string.Empty);
        }

        private async Task<(bool result, string error)> UpdateStgOrderDtl(int stgOrdDltKey, int price, int optnPrice,
            ProdTypeOptnModel prodTypeOptn, ProdModel prodModel, int orderQty, int printQty,
            bool hasCoverMaterial, bool hasPageMaterial)
        {
            // Update stg ord dtl:
            // Change price, optn (create new or delete), material (change or change Cover, Page for MP)
            var stgOrderDtl = await _publishingContext.StgOrderDtl.FirstOrDefaultAsync(f => f.StgOrderDtlKey == stgOrdDltKey);
            if(stgOrderDtl == null)
                return (false, "Order.MyCart.UpdateOrderDtl");

            stgOrderDtl.OrderQty = orderQty;
            stgOrderDtl.PrintQty = printQty;
            // if change material
            stgOrderDtl.Description = prodModel.Description;
            stgOrderDtl.Prod = prodModel.ProdKey;

            stgOrderDtl.Price = price;
            stgOrderDtl.SalesAmt = stgOrderDtl.Price * orderQty;

            // update optn prod
            await UpdateOptnStgOrdDtl(price, optnPrice, prodTypeOptn, prodModel, orderQty, printQty, stgOrderDtl);

            // update cover and page
            if (hasCoverMaterial)
            {
                var updateCoverResult = await UpdateCoverStgOrdDtl(prodModel, orderQty, printQty, stgOrderDtl);
                if (!updateCoverResult.result)
                    return (false, updateCoverResult.error);
            }

            if (hasPageMaterial)
            {
                var updatePageResult = await UpdatePageStgOrdDtl(prodModel, orderQty, printQty, stgOrderDtl);
                if (!updatePageResult.result)
                    return (false, updatePageResult.error);
            }

            try
            {
                await _publishingContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException e)
            {
                Serilog.Log.Error(e, String.Empty);
                //try again
                await _publishingContext.SaveChangesAsync();
            }

            return (true, string.Empty);
        }

        private async Task UpdateOptnStgOrdDtl(int price, int optnPrice, ProdTypeOptnModel prodTypeOptn, ProdModel prodModel,
            int orderQty, int printQty, StgOrderDtl stgOrderDtl)
        {
            // get old optn stg ord dtl
            var optnStgOrderDtl = await _publishingContext.StgOrderDtl.FirstOrDefaultAsync(f =>
                f.StgOrderHdrKey == stgOrderDtl.StgOrderHdrKey
                && f.DtlType == "Prod_Type_Optn_Dtl"
                && f.DtlStatus == "Cart"
                && f.DtlLineNbr == stgOrderDtl.DtlLineNbr);

            // 1. Has new and old prodTypeOptn - if needed change optn and optn price
            if (prodTypeOptn != null && optnStgOrderDtl != null)
            {
                optnStgOrderDtl.OrderQty = orderQty;
                optnStgOrderDtl.PrintQty = printQty;
                optnStgOrderDtl.ProdTypeOptn = prodTypeOptn.ProdTypeOptnKey;
                optnStgOrderDtl.Price = optnPrice;

                var prodTypeOptnDtlList = prodTypeOptn.ProdTypeOptnDtl;
                if (prodTypeOptnDtlList.Any())
                {
                    var prodTypeOptnDtl = prodTypeOptnDtlList.First();
                    optnStgOrderDtl.Description = prodTypeOptnDtl?.Description;
                    optnStgOrderDtl.ProdTypeOptnDtl = prodTypeOptnDtl?.ProdTypeOptnDtlKey;
                    optnStgOrderDtl.ZeroTaxFlg = prodTypeOptnDtl?.ZeroTaxFlg;
                    optnStgOrderDtl.SizeName = prodTypeOptnDtl?.SizeName;
                }

                optnStgOrderDtl.SalesAmt = optnStgOrderDtl.Price * orderQty;
            }

            // 2. Has new and hasn't old prodTypeOptn - add new optn stg ord dtl
            if (prodTypeOptn != null && optnStgOrderDtl == null)
            {
                // create order dtl for optns
                var stgOrderOptnsDtl = await _stgOrderDtl.CreateStgOrderDtl("Cart", OrderDtlType.ProdTypeOptnDtl, price,
                    optnPrice, prodTypeOptn, prodModel, MemberInfo, orderQty, printQty, stgOrderDtl.ProdType.Value,
                    stgOrderDtl.DtlLineNbr.Value,
                    _settings.Language);
                await _publishingContext.StgOrderDtl.AddAsync(stgOrderOptnsDtl);
            }

            // 3. Hasn't new and has old prodTypeOptn - remove old optn stg ord dtl
            if (prodTypeOptn == null && optnStgOrderDtl != null)
            {
                _publishingContext.StgOrderDtl.Remove(optnStgOrderDtl);
            }

            // 4. Hasn't new and hasn't old prodTypeOptn - none action
        }

        private async Task<(bool result, string error)> UpdatePageStgOrdDtl(ProdModel prodModel, int orderQty, int printQty, StgOrderDtl stgOrderDtl)
        {
            // get page stg ord dtl
            var pageStgOrderDtl = await _publishingContext.StgOrderDtl.FirstOrDefaultAsync(f =>
                f.StgOrderHdrKey == stgOrderDtl.StgOrderHdrKey
                && f.DtlType == "MultiPage_Page"
                && f.DtlStatus == "Cart"
                && f.DtlLineNbr == stgOrderDtl.DtlLineNbr);
            if (pageStgOrderDtl == null)
                return (false, "Order.MyCart.UpdateOrderDtl");

            var multiProdList = await _productService.GetProd(stgOrderDtl.ProdType,
                prodModel.MultiPagePageSizeDimension, prodModel.MultiPagePageMaterialStockAbbr, null, null);
            var multiProd = multiProdList.FirstOrDefault(f => f.MultiPageType == "Page");

            var mpDesignType = Misc.StgOrderDtl.GetMPDesignTypeByDBValue(prodModel.MultiPageDesignType);
            var noFrontCover = prodModel.MultipageNoFrontCoverFlg == "Yes";
            var noBackCover = prodModel.MultipageNoBackCoverFlg == "Yes";
            var crossPageNoCoverBacksides = prodModel.MultipageNoCoverBacksidesFlg == "Yes";

            pageStgOrderDtl.PrintQty = Misc.StgOrderDtl.GetInnerPageCount(printQty, mpDesignType, noFrontCover, noBackCover,
                crossPageNoCoverBacksides);

            pageStgOrderDtl.OrderQty = orderQty;
            if (multiProd != null)
            {
                pageStgOrderDtl.Description = multiProd.Description;
                pageStgOrderDtl.Prod = multiProd.ProdKey;
                pageStgOrderDtl.ProdType = multiProd.ProdType;
                pageStgOrderDtl.Price = 0;
                pageStgOrderDtl.SizeDimension = multiProd.SizeName;
                pageStgOrderDtl.PrintSide = multiProd.PrintSide;
                pageStgOrderDtl.SizeUm = multiProd.SizeUm;
                var unitMeasure =
                    await _publishingContext.UnitMeasure.FirstOrDefaultAsync(f => f.UnitMeasureKey == multiProd.SizeUm);
                pageStgOrderDtl.SizeUmId = unitMeasure.UnitMeasureId;
                pageStgOrderDtl.SizeDimension = multiProd.SizeDimension;
            }

            return (true, string.Empty);
        }

        private async Task<(bool result, string error)> UpdateCoverStgOrdDtl(ProdModel prodModel, int orderQty, int printQty, 
            StgOrderDtl stgOrderDtl)
        {
            // get cover stg ord dtl
            var coverStgOrderDtl = await _publishingContext.StgOrderDtl.FirstOrDefaultAsync(f =>
                f.StgOrderHdrKey == stgOrderDtl.StgOrderHdrKey
                && f.DtlType == "MultiPage_Cover"
                && f.DtlStatus == "Cart"
                && f.DtlLineNbr == stgOrderDtl.DtlLineNbr);
            if (coverStgOrderDtl == null)
                return (false, "Order.MyCart.UpdateOrderDtl");

            var multiProdList = await _productService.GetProd(stgOrderDtl.ProdType,
                prodModel.MultiPageCoverSizeDimension, prodModel.MultiPageCoverMaterialStockAbbr, null, null);
            var multiProd = multiProdList.FirstOrDefault(f => f.MultiPageType == "Cover");

            var mpDesignType = Misc.StgOrderDtl.GetMPDesignTypeByDBValue(prodModel.MultiPageDesignType);
            var noFrontCover = prodModel.MultipageNoFrontCoverFlg == "Yes";
            var noBackCover = prodModel.MultipageNoBackCoverFlg == "Yes";
            var crossPageNoCoverBacksides = prodModel.MultipageNoCoverBacksidesFlg == "Yes";

            coverStgOrderDtl.PrintQty = Misc.StgOrderDtl.GetCoverCount(mpDesignType, noFrontCover, noBackCover,
                crossPageNoCoverBacksides);
            coverStgOrderDtl.OrderQty = orderQty;

            if (multiProd != null)
            {
                coverStgOrderDtl.Description = multiProd.Description;
                coverStgOrderDtl.Prod = multiProd.ProdKey;
                coverStgOrderDtl.ProdType = multiProd.ProdType;
                coverStgOrderDtl.Price = 0;
                coverStgOrderDtl.SizeDimension = multiProd.SizeName;
                coverStgOrderDtl.PrintSide = multiProd.PrintSide;
                coverStgOrderDtl.SizeUm = multiProd.SizeUm;
                var unitMeasure =
                    await _publishingContext.UnitMeasure.FirstOrDefaultAsync(f => f.UnitMeasureKey == multiProd.SizeUm);
                coverStgOrderDtl.SizeUmId = unitMeasure.UnitMeasureId;
                coverStgOrderDtl.SizeDimension = multiProd.SizeDimension;
            }

            return (true, string.Empty);
        }
    }
}
