using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Publishing.Repository.DTO;
using Microsoft.EntityFrameworkCore;

namespace Publishing.Repository.Context
{
    public interface TimeStampedModel
    {
        DateTime? LastModified { get; set; }
    }

    public partial class PublishingContext : DbContext
    {
        public PublishingContext()
        {
        }

        public PublishingContext(DbContextOptions<PublishingContext> options)
            : base(options)
        {
        }

        public virtual DbSet<WdmCategory> WdmCategory { get; set; }
        public virtual DbSet<WdmItem> WdmItem { get; set; }
        public virtual DbSet<WdmRating> WdmRating { get; set; }
        public virtual DbSet<WdmSubCategory> WdmSubCategory { get; set; }
        public virtual DbSet<WdmItemLog> WdmItemLog { get; set; }
        public virtual DbSet<StgOrderDtl> StgOrderDtl { get; set; }
        public virtual DbSet<StgOrderHdr> StgOrderHdr { get; set; }
        public virtual DbSet<UnitMeasureDTO> UnitMeasure { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<StgOrderDtl>(entity =>
            {
                entity.HasKey(e => e.StgOrderDtlKey);

                entity.ToTable("STG_ORDER_DTL");

                entity.HasIndex(e => e.Prod)
                    .HasName("ix2_STG_ORDER_DTL");

                entity.HasIndex(e => e.ProdTypeOptn)
                    .HasName("ix3_STG_ORDER_DTL");

                entity.HasIndex(e => e.ProdTypeOptnDtl)
                    .HasName("ix4_STG_ORDER_DTL");

                entity.HasIndex(e => e.StgOrderHdrKey)
                    .HasName("ix1_STG_ORDER_DTL");

                entity.Property(e => e.StgOrderDtlKey).HasColumnName("STG_ORDER_DTL");

                entity.Property(e => e.AuditId)
                    .HasColumnName("AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.Currency).HasColumnName("CURRENCY");

                entity.Property(e => e.CurrencyAbbr)
                    .HasColumnName("CURRENCY_ABBR")
                    .HasMaxLength(16);

                entity.Property(e => e.CurrencyDate)
                    .HasColumnName("CURRENCY_DATE")
                    .HasColumnType("datetime");

                entity.Property(e => e.CurrencyVsNtdRate)
                    .HasColumnName("CURRENCY_VS_NTD_RATE")
                    .HasColumnType("decimal(14, 7)");

                entity.Property(e => e.CurrencyVsUsdRate)
                    .HasColumnName("CURRENCY_VS_USD_RATE")
                    .HasColumnType("decimal(14, 7)");

                entity.Property(e => e.DateHousekeepingStatus)
                    .HasColumnName("Date_Housekeeping_Status")
                    .HasColumnType("datetime");

                entity.Property(e => e.Description)
                    .HasColumnName("DESCRIPTION")
                    .HasMaxLength(120);

                entity.Property(e => e.DiscAmt)
                    .HasColumnName("DISC_AMT")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.DiscAmtUsd)
                    .HasColumnName("DISC_AMT_USD")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.DiscPct)
                    .HasColumnName("DISC_PCT")
                    .HasColumnType("decimal(6, 3)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.DtlLineNbr).HasColumnName("DTL_LINE_NBR");

                entity.Property(e => e.DtlStatus)
                    .HasColumnName("DTL_STATUS")
                    .HasMaxLength(24);

                entity.Property(e => e.DtlSubLineNbr).HasColumnName("DTL_SUB_LINE_NBR");

                entity.Property(e => e.DtlType)
                    .HasColumnName("DTL_TYPE")
                    .HasMaxLength(24);

                entity.Property(e => e.FailedFtpCount)
                    .HasColumnName("FAILED_FTP_COUNT")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.FirstAuditId)
                    .HasColumnName("FIRST_AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.FirstModified)
                    .HasColumnName("FIRST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.FtpStatus)
                    .HasColumnName("FTP_STATUS")
                    .HasMaxLength(24);

                entity.Property(e => e.GraphicMethod)
                    .HasColumnName("GRAPHIC_METHOD")
                    .HasMaxLength(24);

                entity.Property(e => e.HousekeepingStatus)
                    .HasColumnName("Housekeeping_Status")
                    .HasMaxLength(24);

                entity.Property(e => e.Language)
                    .HasColumnName("LANGUAGE")
                    .HasMaxLength(36);

                entity.Property(e => e.LastModified)
                    .HasColumnName("LAST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.OrderQty).HasColumnName("ORDER_QTY");

                entity.Property(e => e.PrePrintStatus)
                    .HasColumnName("PRE_PRINT_STATUS")
                    .HasMaxLength(24);

                entity.Property(e => e.PressFilename)
                    .HasColumnName("PRESS_FILENAME")
                    .HasMaxLength(320);

                entity.Property(e => e.PrevDtlLineNbr).HasColumnName("PREV_DTL_LINE_NBR");

                entity.Property(e => e.Price)
                    .HasColumnName("PRICE")
                    .HasColumnType("decimal(9, 2)");

                entity.Property(e => e.PriceUsd)
                    .HasColumnName("PRICE_USD")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.PrintQty)
                    .HasColumnName("PRINT_QTY")
                    .HasColumnType("decimal(7, 0)");

                entity.Property(e => e.PrintSide)
                    .HasColumnName("PRINT_SIDE")
                    .HasMaxLength(16);

                entity.Property(e => e.PrintSideName)
                    .HasColumnName("PRINT_SIDE_NAME")
                    .HasMaxLength(16);

                entity.Property(e => e.Prod).HasColumnName("PROD");

                entity.Property(e => e.ProdType).HasColumnName("PROD_TYPE");

                entity.Property(e => e.ProdTypeOptn).HasColumnName("PROD_TYPE_OPTN");

                entity.Property(e => e.ProdTypeOptnDtl).HasColumnName("PROD_TYPE_OPTN_DTL");

                entity.Property(e => e.PromotionDisc).HasColumnName("PROMOTION_DISC");

                entity.Property(e => e.PromotionDiscId)
                    .HasColumnName("PROMOTION_DISC_ID")
                    .HasMaxLength(48);

                entity.Property(e => e.ProofStatus)
                    .HasColumnName("PROOF_STATUS")
                    .HasMaxLength(24);

                entity.Property(e => e.SHAmt)
                    .HasColumnName("S_H_AMT")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.SHAmtUsd)
                    .HasColumnName("S_H_AMT_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.SalesAmt)
                    .HasColumnName("SALES_AMT")
                    .HasColumnType("decimal(9, 2)");

                entity.Property(e => e.SalesAmtUsd)
                    .HasColumnName("SALES_AMT_USD")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.ShipmentStatus)
                    .HasColumnName("SHIPMENT_STATUS")
                    .HasMaxLength(24);

                entity.Property(e => e.SiteId)
                    .IsRequired()
                    .HasColumnName("Site_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(N'Default')");

                entity.Property(e => e.SizeDimension)
                    .HasColumnName("SIZE_DIMENSION")
                    .HasMaxLength(48);

                entity.Property(e => e.SizeName)
                    .HasColumnName("SIZE_NAME")
                    .HasMaxLength(48);

                entity.Property(e => e.SizeUm).HasColumnName("SIZE_UM");

                entity.Property(e => e.SizeUmId)
                    .HasColumnName("SIZE_UM_ID")
                    .HasMaxLength(16);

                entity.Property(e => e.StgOrderHdrKey).HasColumnName("STG_ORDER_HDR");

                entity.Property(e => e.Tstamp)
                    .IsRequired()
                    .HasColumnName("TStamp")
                    .IsRowVersion();

                entity.Property(e => e.TwDiscAmtUsd)
                    .HasColumnName("TW_DISC_AMT_USD")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.TwPriceUsd)
                    .HasColumnName("TW_PRICE_USD")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.TwSalesAmtUsd)
                    .HasColumnName("TW_SALES_AMT_USD")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.Weight)
                    .HasColumnName("WEIGHT")
                    .HasColumnType("decimal(9, 4)");

                entity.Property(e => e.WeightUm).HasColumnName("WEIGHT_UM");

                entity.Property(e => e.WeightUmId)
                    .HasColumnName("WEIGHT_UM_ID")
                    .HasMaxLength(16);

                entity.Property(e => e.ZeroTaxFlg)
                    .HasColumnName("ZERO_TAX_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.HasOne(d => d.StgOrderHdrNavigation)
                    .WithMany(p => p.StgOrderDtl)
                    .HasForeignKey(d => d.StgOrderHdrKey)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk1_STG_ORDER_DTL_STG_ORDER_HDR");
            });

            modelBuilder.Entity<StgOrderHdr>(entity =>
            {
                entity.HasKey(e => e.StgOrderHdrKey);

                entity.ToTable("STG_ORDER_HDR");

                entity.HasIndex(e => e.CorpSoldTo)
                    .HasName("ix4_STG_ORDER_HDR");

                entity.HasIndex(e => e.Member)
                    .HasName("ix3_STG_ORDER_HDR");

                entity.HasIndex(e => e.OrderId)
                    .HasName("uk1_STG_ORDER_HDR")
                    .IsUnique();

                entity.HasIndex(e => e.TxnYyyymm)
                    .HasName("ix2_STG_ORDER_HDR");

                entity.HasIndex(e => e.TxnYyyymmdd)
                    .HasName("ix1_STG_ORDER_HDR");

                entity.Property(e => e.StgOrderHdrKey).HasColumnName("STG_ORDER_HDR");

                entity.Property(e => e.AuditId)
                    .HasColumnName("AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.BatchAssignment).HasColumnName("BATCH_ASSIGNMENT");

                entity.Property(e => e.BatchId)
                    .HasColumnName("BATCH_ID")
                    .HasMaxLength(24);

                entity.Property(e => e.BatchYyyymmdd)
                    .HasColumnName("BATCH_YYYYMMDD")
                    .HasMaxLength(8)
                    .IsUnicode(false);

                entity.Property(e => e.BoxWeight)
                    .HasColumnName("BOX_WEIGHT")
                    .HasColumnType("decimal(9, 4)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.BusinessId)
                    .HasColumnName("BUSINESS_ID")
                    .HasMaxLength(24);

                entity.Property(e => e.CardExpYyyymmdd)
                    .HasColumnName("CARD_EXP_YYYYMMDD")
                    .HasMaxLength(8)
                    .IsUnicode(false);

                entity.Property(e => e.CardExtNumber)
                    .HasColumnName("CARD_EXT_NUMBER")
                    .HasMaxLength(8);

                entity.Property(e => e.CardHolderCompName)
                    .HasColumnName("CARD_HOLDER_COMP_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.CardHolderName)
                    .HasColumnName("CARD_HOLDER_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.CardNumber)
                    .HasColumnName("CARD_NUMBER")
                    .HasMaxLength(24);

                entity.Property(e => e.CardType)
                    .HasColumnName("CARD_TYPE")
                    .HasMaxLength(24);

                entity.Property(e => e.CheckNbr)
                    .HasColumnName("CHECK_NBR")
                    .HasMaxLength(8);

                entity.Property(e => e.CorpSoldTo).HasColumnName("CORP_SOLD_TO");

                entity.Property(e => e.Corporate).HasColumnName("CORPORATE");

                entity.Property(e => e.CouponDiscAmt)
                    .HasColumnName("COUPON_DISC_AMT")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CouponDiscAmtUsd)
                    .HasColumnName("COUPON_DISC_AMT_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CouponDiscPct)
                    .HasColumnName("COUPON_DISC_PCT")
                    .HasColumnType("decimal(6, 3)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CouponId)
                    .HasColumnName("COUPON_ID")
                    .HasMaxLength(24);

                entity.Property(e => e.CreditFlg)
                    .HasColumnName("CREDIT_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.Currency).HasColumnName("CURRENCY");

                entity.Property(e => e.CurrencyAbbr)
                    .HasColumnName("CURRENCY_ABBR")
                    .HasMaxLength(16);

                entity.Property(e => e.CurrencyDate)
                    .HasColumnName("CURRENCY_DATE")
                    .HasColumnType("datetime");

                entity.Property(e => e.CurrencyVsNtdRate)
                    .HasColumnName("CURRENCY_VS_NTD_RATE")
                    .HasColumnType("decimal(14, 7)");

                entity.Property(e => e.CurrencyVsUsdRate)
                    .HasColumnName("CURRENCY_VS_USD_RATE")
                    .HasColumnType("decimal(14, 7)");

                entity.Property(e => e.DateClose)
                    .HasColumnName("DATE_CLOSE")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateFtp)
                    .HasColumnName("DATE_FTP")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateFtpAck)
                    .HasColumnName("DATE_FTP_ACK")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateHousekeepingStatus)
                    .HasColumnName("Date_Housekeeping_Status")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateInvoice)
                    .HasColumnName("DATE_INVOICE")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateOrder)
                    .HasColumnName("DATE_ORDER")
                    .HasColumnType("datetime");

                entity.Property(e => e.DatePayment)
                    .HasColumnName("DATE_PAYMENT")
                    .HasColumnType("datetime");

                entity.Property(e => e.DatePrint)
                    .HasColumnName("DATE_PRINT")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateRefund)
                    .HasColumnName("DATE_REFUND")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateShipment)
                    .HasColumnName("DATE_SHIPMENT")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateStatus)
                    .HasColumnName("DATE_STATUS")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateTracking)
                    .HasColumnName("DATE_TRACKING")
                    .HasColumnType("datetime");

                entity.Property(e => e.DiscAmt)
                    .HasColumnName("DISC_AMT")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.DiscAmtUsd)
                    .HasColumnName("DISC_AMT_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.DiscPct)
                    .HasColumnName("DISC_PCT")
                    .HasColumnType("decimal(6, 3)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.FactoryFilesSentFlg)
                    .HasColumnName("FACTORY_FILES_SENT_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false);

                entity.Property(e => e.FirstAuditId)
                    .HasColumnName("FIRST_AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.FirstModified)
                    .HasColumnName("FIRST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.GraphicMethod)
                    .HasColumnName("GRAPHIC_METHOD")
                    .HasMaxLength(24);

                entity.Property(e => e.GrossWeight)
                    .HasColumnName("GROSS_WEIGHT")
                    .HasColumnType("decimal(9, 4)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.HousekeepingStatus)
                    .HasColumnName("Housekeeping_Status")
                    .HasMaxLength(24);

                entity.Property(e => e.IncludeSampleFlg)
                    .HasColumnName("INCLUDE_SAMPLE_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.InvoiceAddr1)
                    .HasColumnName("Invoice_Addr_1")
                    .HasMaxLength(80);

                entity.Property(e => e.InvoiceAddr2)
                    .HasColumnName("Invoice_Addr_2")
                    .HasMaxLength(80);

                entity.Property(e => e.InvoiceCity)
                    .HasColumnName("Invoice_City")
                    .HasMaxLength(80);

                entity.Property(e => e.InvoiceDistrict)
                    .HasColumnName("Invoice_District")
                    .HasMaxLength(24);

                entity.Property(e => e.InvoiceEmailAddr)
                    .HasColumnName("Invoice_Email_Addr")
                    .HasMaxLength(120);

                entity.Property(e => e.InvoiceHandleType)
                    .HasColumnName("Invoice_Handle_Type")
                    .HasMaxLength(24);

                entity.Property(e => e.InvoiceIndividualMethod)
                    .HasColumnName("Invoice_Individual_Method")
                    .HasMaxLength(24);

                entity.Property(e => e.InvoiceMobileCode)
                    .HasColumnName("Invoice_Mobile_Code")
                    .HasMaxLength(16);

                entity.Property(e => e.InvoiceNaturePersonId)
                    .HasColumnName("Invoice_Nature_Person_ID")
                    .HasMaxLength(24);

                entity.Property(e => e.InvoiceNbr)
                    .HasColumnName("INVOICE_NBR")
                    .HasMaxLength(24);

                entity.Property(e => e.InvoicePrintType)
                    .HasColumnName("INVOICE_PRINT_TYPE")
                    .HasMaxLength(16);

                entity.Property(e => e.InvoiceShipType)
                    .HasColumnName("INVOICE_SHIP_TYPE")
                    .HasMaxLength(16);

                entity.Property(e => e.InvoiceTitle)
                    .HasColumnName("INVOICE_TITLE")
                    .HasMaxLength(40);

                entity.Property(e => e.ItemCount)
                    .HasColumnName("ITEM_COUNT")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.LastModified)
                    .HasColumnName("LAST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.LcpOrderId)
                    .HasColumnName("LCP_ORDER_ID")
                    .HasMaxLength(48);

                entity.Property(e => e.MarketTaiwanRid)
                    .HasColumnName("MARKET_TAIWAN_RID")
                    .HasMaxLength(12)
                    .IsUnicode(false);

                entity.Property(e => e.Member).HasColumnName("MEMBER");

                entity.Property(e => e.MemberDisc).HasColumnName("MEMBER_DISC");

                entity.Property(e => e.MerchantCost)
                    .HasColumnName("MERCHANT_COST")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.MerchantCostNtd)
                    .HasColumnName("MERCHANT_COST_NTD")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.MerchantCostUsd)
                    .HasColumnName("MERCHANT_COST_USD")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.OrderId)
                    .IsRequired()
                    .HasColumnName("ORDER_ID")
                    .HasMaxLength(48);

                entity.Property(e => e.OrderStage).HasColumnName("ORDER_STAGE");

                entity.Property(e => e.OrderStatus)
                    .HasColumnName("ORDER_STATUS")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("('Cart')");

                entity.Property(e => e.OrderTracking).HasColumnName("ORDER_TRACKING");

                entity.Property(e => e.PaidAmt)
                    .HasColumnName("PAID_AMT")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.PaidAmtUsd)
                    .HasColumnName("PAID_AMT_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.PaidFlg)
                    .HasColumnName("PAID_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.PayGatewayPayerId)
                    .HasColumnName("PAY_GATEWAY_PAYER_ID")
                    .HasMaxLength(80);

                entity.Property(e => e.PayGatewayRefNbr)
                    .HasColumnName("PAY_GATEWAY_REF_NBR")
                    .HasMaxLength(80);

                entity.Property(e => e.PaymentMethod)
                    .HasColumnName("PAYMENT_METHOD")
                    .HasMaxLength(24);

                entity.Property(e => e.PaymentOverrideBy)
                    .HasColumnName("PAYMENT_OVERRIDE_BY")
                    .HasMaxLength(24);

                entity.Property(e => e.PaymentOverrideFlg)
                    .HasColumnName("PAYMENT_OVERRIDE_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.PricingGroup)
                    .HasColumnName("PRICING_GROUP")
                    .HasMaxLength(24);

                entity.Property(e => e.PromotionDisc).HasColumnName("PROMOTION_DISC");

                entity.Property(e => e.PromotionDiscId)
                    .HasColumnName("PROMOTION_DISC_ID")
                    .HasMaxLength(48);

                entity.Property(e => e.RefMember).HasColumnName("REF_MEMBER");

                entity.Property(e => e.RefundAmt)
                    .HasColumnName("REFUND_AMT")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.RefundAmtUsd)
                    .HasColumnName("REFUND_AMT_USD")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.RefundBy)
                    .HasColumnName("REFUND_BY")
                    .HasMaxLength(24);

                entity.Property(e => e.RefundFlg)
                    .HasColumnName("REFUND_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.RemoteZipFee)
                    .HasColumnName("REMOTE_ZIP_FEE")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.RemoteZipFeeUsd)
                    .HasColumnName("REMOTE_ZIP_FEE_USD")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.Rmk)
                    .HasColumnName("RMK")
                    .HasMaxLength(240);

                entity.Property(e => e.SHAmtDtl)
                    .HasColumnName("S_H_AMT_DTL")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.SHAmtDtlUsd)
                    .HasColumnName("S_H_AMT_DTL_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.SHAmtHdr)
                    .HasColumnName("S_H_AMT_HDR")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.SHAmtHdrUsd)
                    .HasColumnName("S_H_AMT_HDR_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.SalesAmt)
                    .HasColumnName("SALES_AMT")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.SalesAmtUsd)
                    .HasColumnName("SALES_AMT_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.SalesTaxAmt)
                    .HasColumnName("SALES_TAX_AMT")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.SalesTaxAmtUsd)
                    .HasColumnName("SALES_TAX_AMT_USD")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.SalesTaxRate)
                    .HasColumnName("SALES_TAX_RATE")
                    .HasColumnType("decimal(7, 4)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.SelfPickupFlg)
                    .HasColumnName("Self_Pickup_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.ShipAddr1)
                    .HasColumnName("SHIP_ADDR_1")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipAddr2)
                    .HasColumnName("SHIP_ADDR_2")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipAddr3)
                    .HasColumnName("SHIP_ADDR_3")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipCellPhoneNumber)
                    .HasColumnName("SHIP_CELL_PHONE_NUMBER")
                    .HasMaxLength(36);

                entity.Property(e => e.ShipCity)
                    .HasColumnName("SHIP_CITY")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipCompanyName)
                    .HasColumnName("SHIP_COMPANY_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipCountry).HasColumnName("SHIP_COUNTRY");

                entity.Property(e => e.ShipCountryName)
                    .HasColumnName("SHIP_COUNTRY_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipDepartmentName)
                    .HasColumnName("SHIP_DEPARTMENT_NAME")
                    .HasMaxLength(40);

                entity.Property(e => e.ShipDistrict)
                    .HasColumnName("SHIP_DISTRICT")
                    .HasMaxLength(24);

                entity.Property(e => e.ShipFirstName)
                    .HasColumnName("SHIP_FIRST_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipLastName)
                    .HasColumnName("SHIP_LAST_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipPackageCount).HasColumnName("SHIP_PACKAGE_COUNT");

                entity.Property(e => e.ShipPhoneNumber)
                    .HasColumnName("SHIP_PHONE_NUMBER")
                    .HasMaxLength(36);

                entity.Property(e => e.ShipStateProvince)
                    .HasColumnName("SHIP_STATE_PROVINCE")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipSurname)
                    .HasColumnName("SHIP_SURNAME")
                    .HasMaxLength(12);

                entity.Property(e => e.ShipZipCode)
                    .HasColumnName("SHIP_ZIP_CODE")
                    .HasMaxLength(16);

                entity.Property(e => e.ShipZoneId)
                    .HasColumnName("SHIP_ZONE_ID")
                    .HasMaxLength(12);

                entity.Property(e => e.ShippedFlg)
                    .HasColumnName("SHIPPED_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.Shipper).HasColumnName("SHIPPER");

                entity.Property(e => e.ShippingCost)
                    .HasColumnName("SHIPPING_COST")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.ShippingCostNtd)
                    .HasColumnName("SHIPPING_COST_NTD")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.ShippingCostUsd)
                    .HasColumnName("SHIPPING_COST_USD")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.ShoppingCartFlg)
                    .HasColumnName("SHOPPING_CART_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('Yes')");

                entity.Property(e => e.SiteId)
                    .IsRequired()
                    .HasColumnName("Site_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(N'Default')");

                entity.Property(e => e.SoldAddr1)
                    .HasColumnName("SOLD_ADDR_1")
                    .HasMaxLength(80);

                entity.Property(e => e.SoldAddr2)
                    .HasColumnName("SOLD_ADDR_2")
                    .HasMaxLength(80);

                entity.Property(e => e.SoldAddr3)
                    .HasColumnName("SOLD_ADDR_3")
                    .HasMaxLength(80);

                entity.Property(e => e.SoldCellPhoneNumber)
                    .HasColumnName("SOLD_CELL_PHONE_NUMBER")
                    .HasMaxLength(36);

                entity.Property(e => e.SoldCity)
                    .HasColumnName("SOLD_CITY")
                    .HasMaxLength(80);

                entity.Property(e => e.SoldCompanyName)
                    .HasColumnName("SOLD_COMPANY_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.SoldCountry).HasColumnName("SOLD_COUNTRY");

                entity.Property(e => e.SoldCountryName)
                    .HasColumnName("SOLD_COUNTRY_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.SoldDepartmentName)
                    .HasColumnName("SOLD_DEPARTMENT_NAME")
                    .HasMaxLength(40);

                entity.Property(e => e.SoldDistrict)
                    .HasColumnName("SOLD_DISTRICT")
                    .HasMaxLength(24);

                entity.Property(e => e.SoldFirstName)
                    .HasColumnName("SOLD_FIRST_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.SoldLastName)
                    .HasColumnName("SOLD_LAST_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.SoldPhoneNumber)
                    .HasColumnName("SOLD_PHONE_NUMBER")
                    .HasMaxLength(36);

                entity.Property(e => e.SoldStateProvince)
                    .HasColumnName("SOLD_STATE_PROVINCE")
                    .HasMaxLength(80);

                entity.Property(e => e.SoldSurname)
                    .HasColumnName("SOLD_SURNAME")
                    .HasMaxLength(12);

                entity.Property(e => e.SoldZipCode)
                    .HasColumnName("SOLD_ZIP_CODE")
                    .HasMaxLength(16);

                entity.Property(e => e.SoldZoneId)
                    .HasColumnName("SOLD_ZONE_ID")
                    .HasMaxLength(12);

                entity.Property(e => e.SurchargeAmt)
                    .HasColumnName("SURCHARGE_AMT")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.SurchargeAmtUsd)
                    .HasColumnName("SURCHARGE_AMT_USD")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.TaxableAmt)
                    .HasColumnName("TAXABLE_AMT")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.TaxableAmtUsd)
                    .HasColumnName("TAXABLE_AMT_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.Tstamp)
                    .IsRequired()
                    .HasColumnName("TStamp")
                    .IsRowVersion();

                entity.Property(e => e.TwCouponDiscAmtUsd)
                    .HasColumnName("TW_COUPON_DISC_AMT_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.TwDiscAmtUsd)
                    .HasColumnName("TW_DISC_AMT_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.TwSalesAmtUsd)
                    .HasColumnName("TW_SALES_AMT_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.TwSalesTaxAmtUsd)
                    .HasColumnName("TW_SALES_TAX_AMT_USD")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.TxnYyyymm)
                    .HasColumnName("TXN_YYYYMM")
                    .HasMaxLength(6)
                    .IsUnicode(false);

                entity.Property(e => e.TxnYyyymmdd)
                    .HasColumnName("TXN_YYYYMMDD")
                    .HasMaxLength(8)
                    .IsUnicode(false);

                entity.Property(e => e.UploadBy)
                    .HasColumnName("UPLOAD_BY")
                    .HasMaxLength(24);

                entity.Property(e => e.UploadDoneAt)
                    .HasColumnName("UPLOAD_DONE_AT")
                    .HasColumnType("datetime");

                entity.Property(e => e.UploadDoneFlg)
                    .HasColumnName("UPLOAD_DONE_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false);

                entity.Property(e => e.UploadMethod)
                    .HasColumnName("UPLOAD_METHOD")
                    .HasMaxLength(16);

                entity.Property(e => e.Weight)
                    .HasColumnName("WEIGHT")
                    .HasColumnType("decimal(9, 4)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.WeightUm).HasColumnName("WEIGHT_UM");

                entity.Property(e => e.WeightUmId)
                    .HasColumnName("WEIGHT_UM_ID")
                    .HasMaxLength(16);

                entity.Property(e => e.Yyyymmddhh)
                    .HasColumnName("YYYYMMDDHH")
                    .HasMaxLength(10)
                    .IsUnicode(false);
            });

            modelBuilder.Entity<WdmCategory>(entity =>
            {
                entity.HasKey(e => e.WdmCategoryKey);

                entity.ToTable("WDM_Category");

                entity.HasIndex(e => e.SiteId)
                    .HasName("ix0_WDM_Category");

                entity.HasIndex(e => e.WdmCategoryId)
                    .HasName("uk1_WDM_Category")
                    .IsUnique();

                entity.Property(e => e.WdmCategoryKey).HasColumnName("WDM_Category");

                entity.Property(e => e.AbbrText)
                    .HasColumnName("Abbr_Text")
                    .HasMaxLength(12);

                entity.Property(e => e.ActiveFlg)
                    .HasColumnName("Active_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('Yes')");

                entity.Property(e => e.AllowedSubfolderLevel)
                    .HasColumnName("Allowed_Subfolder_Level")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.AuditId)
                    .HasColumnName("AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.CanCreateByWdmFlg)
                    .HasColumnName("Can_Create_By_WDM_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('Yes')");

                entity.Property(e => e.CanPublishFlg)
                    .HasColumnName("Can_Publish_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.CanSaveToMyCloudFlg)
                    .HasColumnName("Can_Save_To_MyCloud_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('Yes')");

                entity.Property(e => e.CanUploadFlg)
                    .HasColumnName("Can_Upload_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.ContentLocationPath)
                    .HasColumnName("Content_Location_Path")
                    .HasMaxLength(240);

                entity.Property(e => e.ContentType)
                    .HasColumnName("Content_Type")
                    .HasMaxLength(24)
                    .IsUnicode(false);

                entity.Property(e => e.DefaultFlg)
                    .HasColumnName("Default_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.DeletedFlg)
                    .HasColumnName("Deleted_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.Description).HasMaxLength(80);

                entity.Property(e => e.DisplayColumnCount)
                    .HasColumnName("Display_Column_Count")
                    .HasDefaultValueSql("((3))");

                entity.Property(e => e.ProdType)
                    .HasColumnName("Prod_Type")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.ProdTypeOptnDtl)
                    .HasColumnName("Prod_Type_Optn_Dtl")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.IsWDMLockedTopLayerFlg)
                    .HasColumnName("Is_WDM_Locked_Top_Layer_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.DisplayOrder)
                    .HasColumnName("Display_Order")
                    .HasDefaultValueSql("((1))");

                entity.Property(e => e.EmployeeOnlyFlg)
                    .HasColumnName("Employee_Only_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.FirstAuditId)
                    .HasColumnName("FIRST_AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.FirstModified)
                    .HasColumnName("FIRST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.IconClass)
                    .HasColumnName("Icon_Class")
                    .HasMaxLength(120);

                entity.Property(e => e.IconFontFileUrl)
                    .HasColumnName("Icon_Font_File_URL")
                    .HasMaxLength(240);

                entity.Property(e => e.IconFontLetter)
                    .HasColumnName("Icon_Font_Letter")
                    .HasMaxLength(2)
                    .IsUnicode(false);

                entity.Property(e => e.IconUrl)
                    .HasColumnName("Icon_URL")
                    .HasMaxLength(240);

                entity.Property(e => e.IsConsideredPublishedFlg)
                    .HasColumnName("Is_Considered_Published_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.LastModified)
                    .HasColumnName("LAST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.MyCloudSubFolderName)
                    .HasColumnName("MyCloud_SubFolder_Name")
                    .HasMaxLength(60);

                entity.Property(e => e.SiteId)
                    .HasColumnName("Site_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("('Default')");

                entity.Property(e => e.Tstamp)
                    .IsRequired()
                    .HasColumnName("TStamp")
                    .IsRowVersion();

                entity.Property(e => e.WdmCategoryId)
                    .IsRequired()
                    .HasColumnName("WDM_Category_ID")
                    .HasMaxLength(40);

                entity.Property(e => e.WebTip)
                    .HasColumnName("Web_Tip")
                    .HasMaxLength(40);
            });

            modelBuilder.Entity<WdmItem>(entity =>
            {
                entity.HasKey(e => e.WdmItemKey);

                entity.ToTable("WDM_Item");

                entity.HasIndex(e => e.Member)
                    .HasName("ix1_WDM_Item");

                entity.HasIndex(e => e.ProdType)
                    .HasName("ix4_WDM_Item");

                entity.HasIndex(e => e.PublishStatus)
                    .HasName("ix6_WDM_Item");

                entity.HasIndex(e => e.PublishYyyymmdd)
                    .HasName("ix5_WDM_Item");

                entity.HasIndex(e => e.SiteId)
                    .HasName("ix0_WDM_Item");

                entity.HasIndex(e => e.WdmCategoryId)
                    .HasName("ix2_WDM_Item");

                entity.HasIndex(e => e.WdmItemId)
                    .HasName("uk1_WDM_Item")
                    .IsUnique();

                entity.HasIndex(e => new { e.WdmCategoryId, e.WdmSubCategoryId })
                    .HasName("ix3_WDM_Item");

                entity.Property(e => e.WdmItemKey).HasColumnName("WDM_Item");

                entity.Property(e => e.ActiveFlg)
                    .HasColumnName("Active_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('Yes')");

                entity.Property(e => e.AuditId)
                    .HasColumnName("AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.CountFbComment)
                    .HasColumnName("Count_FB_Comment")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CountFbLike)
                    .HasColumnName("Count_FB_Like")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CountFbShare)
                    .HasColumnName("Count_FB_Share")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CountSendToFriends)
                    .HasColumnName("Count_Send_To_Friends")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CountWdmOrdered)
                    .HasColumnName("Count_WDM_Ordered")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CountWdmPaid)
                    .HasColumnName("Count_WDM_Paid")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CountWdmRating)
                    .HasColumnName("Count_WDM_Rating")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CountWdmUsage)
                    .HasColumnName("Count_WDM_Usage")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.Description).HasMaxLength(1200);

                entity.Property(e => e.FirstAuditId)
                    .HasColumnName("FIRST_AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.FirstModified)
                    .HasColumnName("FIRST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.ItemName)
                    .IsRequired()
                    .HasColumnName("Item_Name")
                    .HasMaxLength(120);

                entity.Property(e => e.KeywordsText)
                    .HasColumnName("Keywords_Text")
                    .HasMaxLength(1200);

                entity.Property(e => e.LastCacheUpdatingAt)
                    .HasColumnName("Last_Cache_Updating_At")
                    .HasColumnType("datetime");

                entity.Property(e => e.LastFbLikeAt)
                    .HasColumnName("Last_FB_Like_At")
                    .HasColumnType("datetime");

                entity.Property(e => e.LastFbShareAt)
                    .HasColumnName("Last_FB_Share_At")
                    .HasColumnType("datetime");

                entity.Property(e => e.LastModified)
                    .HasColumnName("LAST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.LastWdmAccessAt)
                    .HasColumnName("Last_WDM_Access_At")
                    .HasColumnType("datetime");

                entity.Property(e => e.LastWdmCommentAt)
                    .HasColumnName("Last_WDM_Comment_At")
                    .HasColumnType("datetime");

                entity.Property(e => e.LastWdmRatingAt)
                    .HasColumnName("Last_WDM_Rating_At")
                    .HasColumnType("datetime");

                entity.Property(e => e.Price)
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.PrivateToClientFlg)
                    .HasColumnName("Private_To_Client_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.ProdType).HasColumnName("Prod_Type");

                entity.Property(e => e.PublishStatus)
                    .HasColumnName("Publish_Status")
                    .HasMaxLength(24);

                entity.Property(e => e.PublishYyyymmdd)
                    .IsRequired()
                    .HasColumnName("Publish_Yyyymmdd")
                    .HasMaxLength(8)
                    .IsUnicode(false);

                entity.Property(e => e.SiteId)
                    .HasColumnName("Site_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("('Default')");

                entity.Property(e => e.SizeDimension)
                    .HasColumnName("Size_Dimension")
                    .HasMaxLength(48);

                entity.Property(e => e.StoragePath)
                    .IsRequired()
                    .HasColumnName("Storage_Path")
                    .HasMaxLength(400);

                entity.Property(e => e.TotalPaymentAmt)
                    .HasColumnName("Total_Payment_Amt")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.Tstamp)
                    .IsRequired()
                    .HasColumnName("TStamp")
                    .IsRowVersion();

                entity.Property(e => e.WdmCategoryId)
                    .IsRequired()
                    .HasColumnName("WDM_Category_ID")
                    .HasMaxLength(40);

                entity.Property(e => e.WdmItemId)
                    .IsRequired()
                    .HasColumnName("WDM_Item_ID")
                    .HasMaxLength(30)
                    .IsUnicode(false);

                entity.Property(e => e.WdmRating)
                    .HasColumnName("WDM_Rating")
                    .HasColumnType("decimal(7, 3)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.WdmSubCategoryId)
                    .IsRequired()
                    .HasColumnName("WDM_Sub_Category_ID")
                    .HasMaxLength(40);

                entity.Property(e => e.PublishStatusDisposition)
                    .HasColumnName("Publish_Status_Disposition")
                    .HasMaxLength(24);

                entity.Property(e => e.SizeWidthDesign)
                    .HasColumnName("Size_W_Design")
                    .HasColumnType("decimal(11, 4)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.SizeHeightDesign)
                    .HasColumnName("Size_H_Design")
                    .HasColumnType("decimal(11, 4)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.ProdTypeOptnDtl)
                    .HasColumnName("Prod_Type_Optn_Dtl")
                    .HasDefaultValueSql("((0))");
            });

            modelBuilder.Entity<WdmRating>(entity =>
            {
                entity.HasKey(e => e.WdmRatingKey);

                entity.ToTable("WDM_Rating");

                entity.HasIndex(e => e.SiteId)
                    .HasName("ix0_WDM_Rating");

                entity.HasIndex(e => new { e.RateAgainst, e.WdmItemIdOrMember, e.RaterMemberOrUniqId })
                    .HasName("uk1_WDM_Rating")
                    .IsUnique();

                entity.Property(e => e.WdmRatingKey).HasColumnName("WDM_Rating");

                entity.Property(e => e.AuditId)
                    .HasColumnName("AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.FirstAuditId)
                    .HasColumnName("FIRST_AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.FirstModified)
                    .HasColumnName("FIRST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.Ip)
                    .IsRequired()
                    .HasColumnName("IP")
                    .HasMaxLength(36)
                    .IsUnicode(false);

                entity.Property(e => e.LastModified)
                    .HasColumnName("LAST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.RateAgainst)
                    .IsRequired()
                    .HasColumnName("Rate_Against")
                    .HasMaxLength(16)
                    .IsUnicode(false);

                entity.Property(e => e.RaterIsMemberFlg)
                    .HasColumnName("Rater_is_Member_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.RaterMemberOrUniqId)
                    .IsRequired()
                    .HasColumnName("Rater_Member_or_Uniq_ID")
                    .HasMaxLength(40)
                    .IsUnicode(false);

                entity.Property(e => e.SiteId)
                    .HasColumnName("Site_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("('Default')");

                entity.Property(e => e.Tstamp)
                    .IsRequired()
                    .HasColumnName("TStamp")
                    .IsRowVersion();

                entity.Property(e => e.WdmItemIdOrMember)
                    .IsRequired()
                    .HasColumnName("WDM_Item_ID_or_Member")
                    .HasMaxLength(30)
                    .IsUnicode(false);
            });

            modelBuilder.Entity<WdmSubCategory>(entity =>
            {
                entity.HasKey(e => e.WdmSubCategoryKey);

                entity.ToTable("WDM_Sub_Category");

                entity.HasIndex(e => e.SiteId)
                    .HasName("ix0_WDM_Sub_Category");

                entity.HasIndex(e => e.WdmCategoryId)
                    .HasName("ix1_WDM_Sub_Category");

                entity.HasIndex(e => new { e.WdmCategoryId, e.WdmSubCategoryId })
                    .HasName("uk1_WDM_Sub_Category")
                    .IsUnique();

                entity.Property(e => e.WdmSubCategoryKey).HasColumnName("WDM_Sub_Category");

                entity.Property(e => e.AbbrText)
                    .HasColumnName("Abbr_Text")
                    .HasMaxLength(12);

                entity.Property(e => e.ActiveFlg)
                    .HasColumnName("Active_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('Yes')");

                entity.Property(e => e.AuditId)
                    .HasColumnName("AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.CreatorMember).HasColumnName("Creator_Member");

                entity.Property(e => e.CreatorUserId)
                    .HasColumnName("Creator_User_ID")
                    .HasMaxLength(24);

                entity.Property(e => e.DeletedFlg)
                    .HasColumnName("Deleted_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.Description).HasMaxLength(80);

                entity.Property(e => e.DisplayOrder)
                    .HasColumnName("Display_Order")
                    .HasDefaultValueSql("((1))");

                entity.Property(e => e.FirstAuditId)
                    .HasColumnName("FIRST_AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.FirstModified)
                    .HasColumnName("FIRST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.IconUrl)
                    .HasColumnName("Icon_URL")
                    .HasMaxLength(240);

                entity.Property(e => e.IconClass)
                    .HasColumnName("Icon_Class")
                    .HasMaxLength(120);

                entity.Property(e => e.LastModified)
                    .HasColumnName("LAST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.SiteId)
                    .HasColumnName("Site_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("('Default')");

                entity.Property(e => e.Tstamp)
                    .IsRequired()
                    .HasColumnName("TStamp")
                    .IsRowVersion();

                entity.Property(e => e.WdmCategoryId)
                    .IsRequired()
                    .HasColumnName("WDM_Category_ID")
                    .HasMaxLength(40);

                entity.Property(e => e.WdmSubCategoryId)
                    .IsRequired()
                    .HasColumnName("WDM_Sub_Category_ID")
                    .HasMaxLength(40);

                entity.Property(e => e.WebTip)
                    .HasColumnName("Web_Tip")
                    .HasMaxLength(40);

                entity.HasOne(d => d.WdmCategory)
                    .WithMany(p => p.WdmSubCategory)
                    .HasPrincipalKey(p => p.WdmCategoryId)
                    .HasForeignKey(d => d.WdmCategoryId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk1_WDM_Sub_Category");
            });

            modelBuilder.Entity<WdmItemLog>(entity =>
            {
                entity.HasKey(e => e.WdmItemLogKey);

                entity.ToTable("WDM_Item_Log");

                entity.HasIndex(e => e.LogYyyymmdd)
                    .HasName("ix2_WDM_Item_Log");

                entity.HasIndex(e => e.LoggerId)
                    .HasName("ix3_WDM_Item_Log");

                entity.HasIndex(e => e.SiteId)
                    .HasName("ix0_WDM_Item_Log");

                entity.HasIndex(e => e.WdmItem)
                    .HasName("ix1_WDM_Item_Log");

                entity.Property(e => e.WdmItemLogKey).HasColumnName("WDM_Item_Log");

                entity.Property(e => e.AuditId)
                    .HasColumnName("AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.FirstAuditId)
                    .HasColumnName("FIRST_AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.FirstModified)
                    .HasColumnName("FIRST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.LastModified)
                    .HasColumnName("LAST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.LogText)
                    .HasColumnName("Log_Text")
                    .HasMaxLength(1200);

                entity.Property(e => e.LogType)
                    .IsRequired()
                    .HasColumnName("Log_Type")
                    .HasMaxLength(48);

                entity.Property(e => e.LogYyyymmdd)
                    .IsRequired()
                    .HasColumnName("Log_Yyyymmdd")
                    .HasMaxLength(8)
                    .IsUnicode(false);

                entity.Property(e => e.LoggerId)
                    .HasColumnName("Logger_ID")
                    .HasMaxLength(24);

                entity.Property(e => e.LoggerType)
                    .IsRequired()
                    .HasColumnName("Logger_Type")
                    .HasMaxLength(20);

                entity.Property(e => e.Price).HasColumnType("decimal(9, 2)");

                entity.Property(e => e.SiteId)
                    .HasColumnName("Site_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("('Default')");

                entity.Property(e => e.Tstamp)
                    .IsRequired()
                    .HasColumnName("TStamp")
                    .IsRowVersion();

                entity.Property(e => e.WdmItem).HasColumnName("WDM_Item");
            });

            modelBuilder.Entity<UnitMeasureDTO>(entity =>
            {
                entity.HasKey(e => e.UnitMeasureKey);

                entity.ToTable("UNIT_MEASURE");

                entity.HasIndex(e => e.UnitMeasureId)
                    .HasName("uk1_UNIT_MEASURE")
                    .IsUnique();

                entity.Property(e => e.UnitMeasureKey).HasColumnName("UNIT_MEASURE");

                entity.Property(e => e.AuditId)
                    .HasColumnName("AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.BaseUnitMeasureId)
                    .HasColumnName("BASE_UNIT_MEASURE_ID")
                    .HasMaxLength(16);

                entity.Property(e => e.ConversionRate)
                    .HasColumnName("CONVERSION_RATE")
                    .HasColumnType("decimal(14, 7)");

                entity.Property(e => e.Description)
                    .HasColumnName("DESCRIPTION")
                    .HasMaxLength(80);

                entity.Property(e => e.FirstAuditId)
                    .HasColumnName("FIRST_AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.FirstModified)
                    .HasColumnName("FIRST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.LastModified)
                    .HasColumnName("LAST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.SiteId)
                    .IsRequired()
                    .HasColumnName("Site_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(N'Default')");

                entity.Property(e => e.Tstamp)
                    .IsRequired()
                    .HasColumnName("TStamp")
                    .IsRowVersion();

                entity.Property(e => e.UnitMeasureId)
                    .IsRequired()
                    .HasColumnName("UNIT_MEASURE_ID")
                    .HasMaxLength(16);

                entity.Property(e => e.UnitMeasureIdCh)
                    .HasColumnName("UNIT_MEASURE_ID_CH")
                    .HasMaxLength(16);
            });
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default(CancellationToken))
        {
            var newEntities = this.ChangeTracker.Entries()
                .Where(
                    x => x.State == EntityState.Added && x.Entity is TimeStampedModel
                )
                .Select(x => x.Entity as TimeStampedModel);

            var modifiedEntities = this.ChangeTracker.Entries()
                .Where(
                    x => x.State == EntityState.Modified && x.Entity is TimeStampedModel
                )
                .Select(x => x.Entity as TimeStampedModel);


            var now = DateTime.Now;
            foreach (var newEntity in newEntities)
            {
                if (newEntity != null)
                {
                    newEntity.LastModified = now;
                }
            }

            foreach (var modifiedEntity in modifiedEntities)
            {
                if (modifiedEntity != null)
                {
                    modifiedEntity.LastModified = now;
                }
            }

            return base.SaveChangesAsync(true, cancellationToken);
        }
    }
}
