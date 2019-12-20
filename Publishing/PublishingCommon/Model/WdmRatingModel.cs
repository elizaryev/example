using System;

namespace PublishingCommon.Model
{
    public partial class WdmRatingModel
    {
        public int WdmRatingKey { get; set; }
        public string RateAgainst { get; set; }
        public string WdmItemIdOrMember { get; set; }
        public short? Rating { get; set; }
        public string FirstAuditId { get; set; }
        public DateTime? FirstModified { get; set; }
        public string AuditId { get; set; }
        public DateTime? LastModified { get; set; }
        public byte[] Tstamp { get; set; }
        public string SiteId { get; set; }
        public string Ip { get; set; }
        public string RaterIsMemberFlg { get; set; }
        public string RaterMemberOrUniqId { get; set; }
    }
}
