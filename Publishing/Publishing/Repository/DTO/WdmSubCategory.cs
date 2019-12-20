using System;
using Publishing.Repository.Context;
using System.ComponentModel.DataAnnotations;

namespace Publishing.Repository.DTO
{
    public partial class WdmSubCategory: TimeStampedModel
    {
        public int WdmSubCategoryKey { get; set; }
        public string WdmCategoryId { get; set; }
        public string WdmSubCategoryId { get; set; }
        public string Description { get; set; }
        public string AbbrText { get; set; }
        public string WebTip { get; set; }
        public string IconUrl { get; set; }
        public string IconClass { get; set; }
        public short? DisplayOrder { get; set; }
        public int? CreatorMember { get; set; }
        public string CreatorUserId { get; set; }
        public string ActiveFlg { get; set; }
        public string DeletedFlg { get; set; }
        public string FirstAuditId { get; set; }
        public DateTime? FirstModified { get; set; }
        public string AuditId { get; set; }
        public DateTime? LastModified { get; set; }
        [Timestamp]
        public byte[] Tstamp { get; set; }
        public string SiteId { get; set; }

        public WdmCategory WdmCategory { get; set; }
    }
}
