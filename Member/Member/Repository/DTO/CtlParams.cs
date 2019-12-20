using System;

namespace Member.Repository.DTO
{
    public partial class CtlParams
    {
        public int CtlParamsKey { get; set; }
        public string Category { get; set; }
        public string CtlParamId { get; set; }
        public string ParamValue { get; set; }
        public string Remarks { get; set; }
        public string FirstAuditId { get; set; }
        public DateTime? FirstModified { get; set; }
        public string AuditId { get; set; }
        public DateTime? LastModified { get; set; }
        public byte[] Tstamp { get; set; }
        public string SiteId { get; set; }
    }
}
