using System;
using System.Collections.Generic;
using Publishing.Repository.Context;
using System.ComponentModel.DataAnnotations;

namespace Publishing.Repository.DTO
{
    public partial class WdmCategory: TimeStampedModel
    {
        public WdmCategory()
        {
            WdmSubCategory = new HashSet<WdmSubCategory>();
        }

        public int WdmCategoryKey { get; set; }
        public string WdmCategoryId { get; set; }
        public string Description { get; set; }
        public string AbbrText { get; set; }
        public string WebTip { get; set; }
        public string IconUrl { get; set; }
        public short? DisplayOrder { get; set; }
        public string ActiveFlg { get; set; }
        public string FirstAuditId { get; set; }
        public DateTime? FirstModified { get; set; }
        public string AuditId { get; set; }
        public DateTime? LastModified { get; set; }
        [Timestamp]
        public byte[] Tstamp { get; set; }
        public string SiteId { get; set; }
        public string MyCloudSubFolderName { get; set; }
        public string DefaultFlg { get; set; }
        public string DeletedFlg { get; set; }
        public string CanUploadFlg { get; set; }
        public string CanCreateByWdmFlg { get; set; }
        public string ContentType { get; set; }
        public string IconFontFileUrl { get; set; }
        public string IconFontLetter { get; set; }
        public string IconClass { get; set; }
        public string ContentLocationPath { get; set; }
        public string CanPublishFlg { get; set; }
        public string EmployeeOnlyFlg { get; set; }
        public short? AllowedSubfolderLevel { get; set; }
        public string CanSaveToMyCloudFlg { get; set; }
        public string IsConsideredPublishedFlg { get; set; }
        public short? DisplayColumnCount { get; set; }
        public int? ProdType { get; set; }
        public int? ProdTypeOptnDtl { get; set; }
        public string IsWDMLockedTopLayerFlg { get; set; }

        public ICollection<WdmSubCategory> WdmSubCategory { get; set; }
    }
}
