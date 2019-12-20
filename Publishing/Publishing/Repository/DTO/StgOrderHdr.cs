using System;
using System.Collections.Generic;
using Publishing.Repository.Context;
using System.ComponentModel.DataAnnotations;

namespace Publishing.Repository.DTO
{
    public partial class StgOrderHdr: TimeStampedModel
    {
        public StgOrderHdr()
        {
            StgOrderDtl = new HashSet<StgOrderDtl>();
        }

        public int StgOrderHdrKey { get; set; }
        public string ShoppingCartFlg { get; set; }
        public string TxnYyyymmdd { get; set; }
        public string TxnYyyymm { get; set; }
        public string OrderId { get; set; }
        public string LcpOrderId { get; set; }
        public string InvoiceNbr { get; set; }
        public string BatchYyyymmdd { get; set; }
        public string BatchId { get; set; }
        public int? BatchAssignment { get; set; }
        public int? OrderTracking { get; set; }
        public int? Member { get; set; }
        public int? RefMember { get; set; }
        public string Yyyymmddhh { get; set; }
        public DateTime? DateOrder { get; set; }
        public DateTime? DatePayment { get; set; }
        public DateTime? DateFtp { get; set; }
        public DateTime? DateFtpAck { get; set; }
        public DateTime? DateRefund { get; set; }
        public DateTime? DateInvoice { get; set; }
        public DateTime? DatePrint { get; set; }
        public DateTime? DateShipment { get; set; }
        public DateTime? DateTracking { get; set; }
        public DateTime? DateClose { get; set; }
        public DateTime? DateStatus { get; set; }
        public int? OrderStage { get; set; }
        public string OrderStatus { get; set; }
        public string IncludeSampleFlg { get; set; }
        public string GraphicMethod { get; set; }
        public string PaidFlg { get; set; }
        public string ShippedFlg { get; set; }
        public string RefundFlg { get; set; }
        public decimal? RefundAmtUsd { get; set; }
        public string RefundBy { get; set; }
        public string CreditFlg { get; set; }
        public string UploadMethod { get; set; }
        public string UploadDoneFlg { get; set; }
        public DateTime? UploadDoneAt { get; set; }
        public string UploadBy { get; set; }
        public string FactoryFilesSentFlg { get; set; }
        public int? ShipPackageCount { get; set; }
        public string SoldFirstName { get; set; }
        public string SoldLastName { get; set; }
        public string SoldAddr1 { get; set; }
        public string SoldAddr2 { get; set; }
        public string SoldAddr3 { get; set; }
        public string SoldCity { get; set; }
        public string SoldStateProvince { get; set; }
        public string SoldZipCode { get; set; }
        public int? SoldCountry { get; set; }
        public string SoldCountryName { get; set; }
        public string SoldZoneId { get; set; }
        public string SoldPhoneNumber { get; set; }
        public string ShipFirstName { get; set; }
        public string ShipLastName { get; set; }
        public string ShipAddr1 { get; set; }
        public string ShipAddr2 { get; set; }
        public string ShipAddr3 { get; set; }
        public string ShipCity { get; set; }
        public string ShipStateProvince { get; set; }
        public string ShipZipCode { get; set; }
        public int? ShipCountry { get; set; }
        public string ShipCountryName { get; set; }
        public string ShipZoneId { get; set; }
        public string ShipPhoneNumber { get; set; }
        public string PricingGroup { get; set; }
        public DateTime? CurrencyDate { get; set; }
        public int? Currency { get; set; }
        public string CurrencyAbbr { get; set; }
        public decimal? CurrencyVsUsdRate { get; set; }
        public decimal? CurrencyVsNtdRate { get; set; }
        public int? ItemCount { get; set; }
        public decimal? SalesTaxRate { get; set; }
        public decimal? SalesAmt { get; set; }
        public decimal? SalesAmtUsd { get; set; }
        public decimal? TaxableAmtUsd { get; set; }
        public int? PromotionDisc { get; set; }
        public string PromotionDiscId { get; set; }
        public decimal? DiscPct { get; set; }
        public decimal? DiscAmt { get; set; }
        public decimal? DiscAmtUsd { get; set; }
        public string CouponId { get; set; }
        public decimal? CouponDiscPct { get; set; }
        public decimal? CouponDiscAmtUsd { get; set; }
        public decimal? SalesTaxAmt { get; set; }
        public decimal? SalesTaxAmtUsd { get; set; }
        public decimal? PaidAmt { get; set; }
        public decimal? PaidAmtUsd { get; set; }
        public string CardType { get; set; }
        public string CardHolderName { get; set; }
        public string CardHolderCompName { get; set; }
        public string CardNumber { get; set; }
        public string CardExtNumber { get; set; }
        public string CardExpYyyymmdd { get; set; }
        public string Rmk { get; set; }
        public string CheckNbr { get; set; }
        public string PayGatewayRefNbr { get; set; }
        public string PayGatewayPayerId { get; set; }
        public int? Shipper { get; set; }
        public int? WeightUm { get; set; }
        public string WeightUmId { get; set; }
        public decimal? Weight { get; set; }
        public decimal? BoxWeight { get; set; }
        public decimal? GrossWeight { get; set; }
        public decimal? SurchargeAmt { get; set; }
        public decimal? SurchargeAmtUsd { get; set; }
        public decimal? RemoteZipFee { get; set; }
        public decimal? RemoteZipFeeUsd { get; set; }
        public decimal? ShippingCostUsd { get; set; }
        public decimal? ShippingCostNtd { get; set; }
        public decimal? MerchantCostUsd { get; set; }
        public decimal? MerchantCostNtd { get; set; }
        public decimal? TwSalesAmtUsd { get; set; }
        public decimal? TwDiscAmtUsd { get; set; }
        public decimal? TwCouponDiscAmtUsd { get; set; }
        public decimal? TwSalesTaxAmtUsd { get; set; }
        public decimal? TaxableAmt { get; set; }
        public decimal? RefundAmt { get; set; }
        public decimal? ShippingCost { get; set; }
        public decimal? CouponDiscAmt { get; set; }
        public decimal? MerchantCost { get; set; }
        public string PaymentMethod { get; set; }
        public string PaymentOverrideFlg { get; set; }
        public string PaymentOverrideBy { get; set; }
        public decimal? SHAmtDtl { get; set; }
        public decimal? SHAmtDtlUsd { get; set; }
        public decimal? SHAmtHdr { get; set; }
        public decimal? SHAmtHdrUsd { get; set; }
        public string SoldSurname { get; set; }
        public string ShipSurname { get; set; }
        public string InvoiceTitle { get; set; }
        public string BusinessId { get; set; }
        public string SoldDistrict { get; set; }
        public string ShipDistrict { get; set; }
        public string InvoicePrintType { get; set; }
        public string InvoiceShipType { get; set; }
        public string ShipCellPhoneNumber { get; set; }
        public string SoldCompanyName { get; set; }
        public string ShipCompanyName { get; set; }
        public int? MemberDisc { get; set; }
        public string SoldCellPhoneNumber { get; set; }
        public int? Corporate { get; set; }
        public int? CorpSoldTo { get; set; }
        public string SoldDepartmentName { get; set; }
        public string ShipDepartmentName { get; set; }
        public string MarketTaiwanRid { get; set; }
        public string FirstAuditId { get; set; }
        public DateTime? FirstModified { get; set; }
        public string AuditId { get; set; }
        public DateTime? LastModified { get; set; }
        [Timestamp]
        public byte[] Tstamp { get; set; }
        public string HousekeepingStatus { get; set; }
        public DateTime? DateHousekeepingStatus { get; set; }
        public string SelfPickupFlg { get; set; }
        public string InvoiceHandleType { get; set; }
        public string InvoiceIndividualMethod { get; set; }
        public string InvoiceEmailAddr { get; set; }
        public string InvoiceCity { get; set; }
        public string InvoiceDistrict { get; set; }
        public string InvoiceAddr1 { get; set; }
        public string InvoiceAddr2 { get; set; }
        public string InvoiceMobileCode { get; set; }
        public string InvoiceNaturePersonId { get; set; }
        public string SiteId { get; set; }

        public ICollection<StgOrderDtl> StgOrderDtl { get; set; }
    }
}
