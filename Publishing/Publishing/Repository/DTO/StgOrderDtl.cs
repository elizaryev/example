using System;
using Publishing.Repository.Context;
using System.ComponentModel.DataAnnotations;

namespace Publishing.Repository.DTO
{
    public partial class StgOrderDtl: TimeStampedModel
    {
        public int? StgOrderDtlKey { get; set; }
        public int StgOrderHdrKey { get; set; }
        public string DtlType { get; set; }
        public string DtlStatus { get; set; }
        public int? DtlLineNbr { get; set; }
        public int? DtlSubLineNbr { get; set; }
        public string Description { get; set; }
        public int? OrderQty { get; set; }
        public string GraphicMethod { get; set; }
        public string Language { get; set; }
        public string FtpStatus { get; set; }
        public string ProofStatus { get; set; }
        public string PrePrintStatus { get; set; }
        public string ShipmentStatus { get; set; }
        public int? Prod { get; set; }
        public int? ProdType { get; set; }
        public int? ProdTypeOptn { get; set; }
        public int? ProdTypeOptnDtl { get; set; }
        public int? PromotionDisc { get; set; }
        public string PromotionDiscId { get; set; }
        public decimal? DiscPct { get; set; }
        public decimal? DiscAmtUsd { get; set; }
        public decimal? PrintQty { get; set; }
        public string PrintSide { get; set; }
        public DateTime? CurrencyDate { get; set; }
        public int? Currency { get; set; }
        public string CurrencyAbbr { get; set; }
        public decimal? CurrencyVsUsdRate { get; set; }
        public decimal? CurrencyVsNtdRate { get; set; }
        public string ZeroTaxFlg { get; set; }
        public decimal? Price { get; set; }
        public decimal? PriceUsd { get; set; }
        public decimal? SalesAmt { get; set; }
        public decimal? SalesAmtUsd { get; set; }
        public string SizeName { get; set; }
        public int? SizeUm { get; set; }
        public string SizeUmId { get; set; }
        public string SizeDimension { get; set; }
        public int? WeightUm { get; set; }
        public string WeightUmId { get; set; }
        public decimal? Weight { get; set; }
        public string PressFilename { get; set; }
        public int? PrevDtlLineNbr { get; set; }
        public decimal? TwDiscAmtUsd { get; set; }
        public decimal? TwPriceUsd { get; set; }
        public decimal? TwSalesAmtUsd { get; set; }
        public decimal? DiscAmt { get; set; }
        public decimal? SHAmt { get; set; }
        public decimal? SHAmtUsd { get; set; }
        public string PrintSideName { get; set; }
        public int? FailedFtpCount { get; set; }
        public string FirstAuditId { get; set; }
        public DateTime? FirstModified { get; set; }
        public string AuditId { get; set; }
        public DateTime? LastModified { get; set; }
        [Timestamp]
        public byte[] Tstamp { get; set; }
        public string HousekeepingStatus { get; set; }
        public DateTime? DateHousekeepingStatus { get; set; }
        public string SiteId { get; set; }

        public StgOrderHdr StgOrderHdrNavigation { get; set; }
    }
}
