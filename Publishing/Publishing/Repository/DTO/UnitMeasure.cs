using System;

namespace Publishing.Repository.DTO
{
    public partial class UnitMeasureDTO
    {
        public int UnitMeasureKey { get; set; }
        public string UnitMeasureId { get; set; }
        public string UnitMeasureIdCh { get; set; }
        public string Description { get; set; }
        public string BaseUnitMeasureId { get; set; }
        public decimal? ConversionRate { get; set; }
        public string FirstAuditId { get; set; }
        public DateTime? FirstModified { get; set; }
        public string AuditId { get; set; }
        public DateTime? LastModified { get; set; }
        public byte[] Tstamp { get; set; }
        public string SiteId { get; set; }
    }
}
