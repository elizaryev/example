using System;

namespace PublishingCommon.Model
{
    public partial class WdmItemModel
    {
        public int WdmItemKey { get; set; }
        public string WdmItemId { get; set; }
        public int Member { get; set; }
        public string StoragePath { get; set; }
        public string ItemName { get; set; }
        public string Description { get; set; }
        public string WdmCategoryId { get; set; }
        public string WdmSubCategoryId { get; set; }
        public string ActiveFlg { get; set; }
        public string KeywordsText { get; set; }
        public string PrivateToClientFlg { get; set; }
        public int? ProdType { get; set; }
        public string SizeDimension { get; set; }
        public string PublishYyyymmdd { get; set; }
        public string PublishStatus { get; set; }
        public decimal? Price { get; set; }
        public DateTime? LastWdmAccessAt { get; set; }
        public DateTime? LastWdmRatingAt { get; set; }
        public DateTime? LastFbLikeAt { get; set; }
        public DateTime? LastFbShareAt { get; set; }
        public DateTime? LastWdmCommentAt { get; set; }
        public DateTime? LastCacheUpdatingAt { get; set; }
        public decimal? WdmRating { get; set; }
        public int? CountWdmRating { get; set; }
        public int? CountWdmUsage { get; set; }
        public int? CountWdmOrdered { get; set; }
        public int? CountWdmPaid { get; set; }
        public int? CountFbLike { get; set; }
        public int? CountFbShare { get; set; }
        public int? CountFbComment { get; set; }
        public int? CountSendToFriends { get; set; }
        public decimal? TotalPaymentAmt { get; set; }
        public string FirstAuditId { get; set; }
        public DateTime? FirstModified { get; set; }
        public string AuditId { get; set; }
        public DateTime? LastModified { get; set; }
        public byte[] Tstamp { get; set; }
        public string SiteId { get; set; }
        public string EmployeeID { get; set; }
        public string PublishStatusDisposition { get; set; }
        public int? ProdTypeOptnDtl { get; set; }
    }
}
