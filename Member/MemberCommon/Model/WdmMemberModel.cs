using System;

namespace MemberCommon.Model
{
    public partial class WdmMemberModel
    {
        public int WdmMemberKey { get; set; }
        public int Member { get; set; }
        public string ActiveFlg { get; set; }
        public DateTime? LastWdmItemAccessAt { get; set; }
        public DateTime? LastMemberAccessAt { get; set; }
        public DateTime? LastFbLikeAt { get; set; }
        public DateTime? LastFbShareAt { get; set; }
        public DateTime? LastRatingAt { get; set; }
        public DateTime? LastCommentAt { get; set; }
        public decimal? MemberRating { get; set; }
        public int? CountRating { get; set; }
        public int? CountWdmItemUsage { get; set; }
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
    }
}
