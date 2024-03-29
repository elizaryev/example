﻿using System;

namespace MemberCommon.Model
{
    public class MemberModel
    {
        public int MemberKey { get; set; }
        public string EmailAddr { get; set; }
        public string MemberPswd { get; set; }
        public string EncryptedPswd { get; set; }
        public string AnonymousFlg { get; set; }
        public string ProMemberFlg { get; set; }
        public string MemberNickName { get; set; }
        public string MemberId { get; set; }
        public string FirstName { get; set; }
        public string MiddleInitial { get; set; }
        public string LastName { get; set; }
        public string ReferByMemberId { get; set; }
        public string CompanyName { get; set; }
        public string MemberType { get; set; }
        public string MemberStatus { get; set; }
        public string PermitAdEmailFlg { get; set; }
        public DateTime? DateStatus { get; set; }
        public string MemberClass { get; set; }
        public string UniqId { get; set; }
        public string LcpLibFolder { get; set; }
        public int? LcpLibLimitInMb { get; set; }
        public string Addr1 { get; set; }
        public string Addr2 { get; set; }
        public string Addr3 { get; set; }
        public string City { get; set; }
        public string StateProvince { get; set; }
        public string ZipCode { get; set; }
        public int? Country { get; set; }
        public string CountryName { get; set; }
        public string PhoneNumber { get; set; }
        public string ShipCompanyName { get; set; }
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
        public string ShipPhoneNumber { get; set; }
        public string SkypeId { get; set; }
        public string FaxNumber { get; set; }
        public string PswdHint { get; set; }
        public string StreetNo { get; set; }
        public string Question1 { get; set; }
        public string Answer1 { get; set; }
        public string Question2 { get; set; }
        public string Answer2 { get; set; }
        public string CityBorn { get; set; }
        public string SsLast4 { get; set; }
        public string CredentialId { get; set; }
        public int? Currency { get; set; }
        public string CurrencyAbbr { get; set; }
        public string CardType { get; set; }
        public string CardHolderName { get; set; }
        public string CardHolderCompName { get; set; }
        public string CardNumber { get; set; }
        public string CardExtNumber { get; set; }
        public string CardExpYyyymmdd { get; set; }
        public decimal? L1MonthAvgSalesUsd { get; set; }
        public decimal? L2MonthAvgSalesUsd { get; set; }
        public decimal? L3MonthAvgSalesUsd { get; set; }
        public decimal? L4MonthAvgSalesUsd { get; set; }
        public decimal? L6MonthAvgSalesUsd { get; set; }
        public decimal? LyMonthAvgSalesUsd { get; set; }
        public decimal? LySalesUsd { get; set; }
        public decimal? LyOrderCount { get; set; }
        public decimal? CySalesUsd { get; set; }
        public decimal? CyOrderCount { get; set; }
        public decimal? LifePurchase { get; set; }
        public decimal? LifePurchaseUsd { get; set; }
        public decimal? LoginCount { get; set; }
        public DateTime? DateMember { get; set; }
        public DateTime? DateProMember { get; set; }
        public DateTime? DateAgencyMember { get; set; }
        public DateTime? DateLastAccess { get; set; }
        public DateTime? DateLastPurchae { get; set; }
        public DateTime? DateLastPayment { get; set; }
        public DateTime? DateLastReferred { get; set; }
        public string FtpIp { get; set; }
        public string FtpRootFolder { get; set; }
        public string FtpUserId { get; set; }
        public string FtpPswd { get; set; }
        public string AgencyMemberFlg { get; set; }
        public int? ParentAgencyMember { get; set; }
        public decimal? AgencyBranchLevel { get; set; }
        public decimal? AgencyTreeSize { get; set; }
        public decimal? AgencyTreeLayers { get; set; }
        public string AgencyCommEligibleFlg { get; set; }
        public DateTime? DateCalcCommEligible { get; set; }
        public DateTime? DateCalcAgencyComm { get; set; }
        public string LastAgencyCommPeriod { get; set; }
        public string AgencyCommPeriod { get; set; }
        public DateTime? DateCommissionPaid { get; set; }
        public decimal? CommissionBalance { get; set; }
        public decimal? AgencyCommRate { get; set; }
        public decimal? AgencyNetworkRate { get; set; }
        public decimal? AgencyMinMonthPurch { get; set; }
        public decimal? AgencyMinQuarterPurch { get; set; }
        public decimal? AgencyMinYearPurch { get; set; }
        public string PaymentMethod { get; set; }
        public string PrivateGalleryId { get; set; }
        public string PrivateTemplateId { get; set; }
        public string PrivateTextLayoutId { get; set; }
        public string CanCrossMyFolderFlg { get; set; }
        public string Surname { get; set; }
        public string ShipSurname { get; set; }
        public string InvoiceTitle { get; set; }
        public string BusinessId { get; set; }
        public string District { get; set; }
        public string ShipDistrict { get; set; }
        public string DobYyyymmdd { get; set; }
        public string EducationLevel { get; set; }
        public string JobProfession { get; set; }
        public string JobTitle { get; set; }
        public decimal? MonthlyIncome { get; set; }
        public string CellPhoneNumber { get; set; }
        public string InvoicePrintType { get; set; }
        public string InvoiceShipType { get; set; }
        public string PlaceOrderPswd { get; set; }
        public string ShipCellPhoneNumber { get; set; }
        public int? Corporate { get; set; }
        public string CorpMgrFlg { get; set; }
        public string CorpCanDoLibFlg { get; set; }
        public string CorpCanManageOrdersFlg { get; set; }
        public string CorpCanPlaceOrderFlg { get; set; }
        public string CorpCanDoPaymentFlg { get; set; }
        public string CorpCanDoSetupFlg { get; set; }
        public string CorpDepartmentName { get; set; }
        public string FirstAuditId { get; set; }
        public DateTime? FirstModified { get; set; }
        public string AuditId { get; set; }
        public DateTime? LastModified { get; set; }
        public byte[] Tstamp { get; set; }
        public string MultiPageLibFolder { get; set; }
        public string PrivateLibFolder { get; set; }
        public int? PrivateLibLimitInMb { get; set; }
        public int? MultiPageLibLimitInMb { get; set; }
        public DateTime? DateLastLcpLibLimitApproval { get; set; }
        public DateTime? DateLastPrivateLibLimitApproval { get; set; }
        public DateTime? DateLastMultiPageLibLimitApproval { get; set; }
        public int? LcpLibUsageInMb { get; set; }
        public int? MultiPageLibUsageInMb { get; set; }
        public int? PrivateLibUsageInMb { get; set; }
        public string HashedPswd { get; set; }
        public Guid? ResetToken { get; set; }
        public DateTime? ResetTokenDate { get; set; }
        public string EmployeeMemberFlg { get; set; }
        public string Guid { get; set; }
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
        public string SoldDepartmentName { get; set; }
        public string ShipDepartmentName { get; set; }
        public DateTime? FbFirstLoginAt { get; set; }
        public string FbId { get; set; }
        public string FbLocale { get; set; }
        public string FbTimezone { get; set; }
        public DateTime? FbUpdatedTime { get; set; }
        public string FbName { get; set; }
        public string FbFirstName { get; set; }
        public string FbLastName { get; set; }
        public string FbGender { get; set; }
        public int? FbAgeRangeMin { get; set; }
        public string FbPictureIsSilhouetteFlg { get; set; }
        public string FbPictureUrl { get; set; }
        public DateTime? GoogleFirstLoginAt { get; set; }
        public string FbLink { get; set; }
        public string FbVerifiedFlg { get; set; }
        public string GoogleEmailVerifiedFlg { get; set; }
        public string GoogleName { get; set; }
        public string GooglePictureUrl { get; set; }
        public string GoogleGivenName { get; set; }
        public string GoogleFamilyName { get; set; }
        public string GoogleLocale { get; set; }
        public string GoogleOpenId { get; set; }
        public string FbNameFormat { get; set; }
        public string FbShortName { get; set; }
        public string ProfileHtml { get; set; }
    }
}
