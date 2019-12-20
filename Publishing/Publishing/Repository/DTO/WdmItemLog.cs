using System;
using Publishing.Repository.Context;
using System.ComponentModel.DataAnnotations;

namespace Publishing.Repository.DTO
{
    public partial class WdmItemLog: TimeStampedModel
    {
        public int WdmItemLogKey { get; set; }
        public int WdmItem { get; set; }
        public string LogYyyymmdd { get; set; }
        public string LogType { get; set; }
        public string LogText { get; set; }
        public string LoggerType { get; set; }
        public string LoggerId { get; set; }
        public decimal? Price { get; set; }
        public string FirstAuditId { get; set; }
        public DateTime? FirstModified { get; set; }
        public string AuditId { get; set; }
        public DateTime? LastModified { get; set; }
        [Timestamp]
        public byte[] Tstamp { get; set; }
        public string SiteId { get; set; }
    }
}
