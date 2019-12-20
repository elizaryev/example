using System;

namespace Member.Repository.DTO
{
    public partial class Employee
    {
        public int EmployeeKey { get; set; }
        public int? Corporate { get; set; }
        public string UserId { get; set; }
        public string EmployeeStatus { get; set; }
        public DateTime? DateStatus { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string NameCh { get; set; }
        public string NickName { get; set; }
        public string UserPswd { get; set; }
        public string UserLvl { get; set; }
        public string CanDoAdmin { get; set; }
        public string CanDoOrder { get; set; }
        public string CanDoShipment { get; set; }
        public string CanDoPayment { get; set; }
        public string CanSelfApprove { get; set; }
        public string Title { get; set; }
        public string JoinPayrollFlg { get; set; }
        public decimal? HourlyRate { get; set; }
        public string FixedWageFlg { get; set; }
        public decimal? FixedWeeklyWage { get; set; }
        public DateTime? HireDate { get; set; }
        public DateTime? TerminateDate { get; set; }
        public DateTime? SuspendDate { get; set; }
        public DateTime? ResumeDate { get; set; }
        public string SsNo { get; set; }
        public string Addr1 { get; set; }
        public string Addr2 { get; set; }
        public string Addr3 { get; set; }
        public string City { get; set; }
        public string StateProvince { get; set; }
        public string ZipCode { get; set; }
        public int? Country { get; set; }
        public string CountryName { get; set; }
        public string PhoneNumber { get; set; }
        public string FaxNumber { get; set; }
        public string EmailAddr { get; set; }
        public int? Currency { get; set; }
        public string CurrencyAbbr { get; set; }
        public string CanDoService { get; set; }
        public string FirstAuditId { get; set; }
        public DateTime? FirstModified { get; set; }
        public string AuditId { get; set; }
        public DateTime? LastModified { get; set; }
        public byte[] Tstamp { get; set; }
        public string HashedPswd { get; set; }
        public string SiteId { get; set; }
    }
}
