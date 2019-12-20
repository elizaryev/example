using Member.Repository.DTO;
using Microsoft.EntityFrameworkCore;

namespace Member.Repository.Context
{
    
    public partial class MemberContext : DbContext
    {

        public MemberContext(DbContextOptions<MemberContext> options)
            : base(options)
        {
            
        }

        public virtual DbSet<DTO.Member> Member { get; set; }
        public virtual DbSet<WdmMember> WdmMember { get; set; }
        public virtual DbSet<Employee> Employee { get; set; }
        public virtual DbSet<CtlParams> CtlParams { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<DTO.Member>(entity =>
            {
                entity.HasKey(e => e.MemberKey);

                entity.ToTable("MEMBER");

                entity.HasIndex(e => e.Addr1)
                    .HasName("ix4_MEMBER");

                entity.HasIndex(e => e.City)
                    .HasName("ix5_MEMBER");

                entity.HasIndex(e => e.EmailAddr)
                    .HasName("uk1_MEMBER")
                    .IsUnique();

                entity.HasIndex(e => e.FbId)
                    .HasName("ix9_Member");

                entity.HasIndex(e => e.FirstName)
                    .HasName("ix2_MEMBER");

                entity.HasIndex(e => e.LastName)
                    .HasName("ix3_MEMBER");

                entity.HasIndex(e => e.MemberId)
                    .HasName("uk2_MEMBER")
                    .IsUnique();

                entity.HasIndex(e => e.ParentAgencyMember)
                    .HasName("ix7_MEMBER");

                entity.HasIndex(e => e.PhoneNumber)
                    .HasName("ix1_MEMBER");

                entity.HasIndex(e => e.ResetToken)
                    .HasName("ix8_Member");

                entity.HasIndex(e => e.ZipCode)
                    .HasName("ix6_MEMBER");

                entity.Property(e => e.MemberKey).HasColumnName("MEMBER");

                entity.Property(e => e.Addr1)
                    .HasColumnName("ADDR_1")
                    .HasMaxLength(80);

                entity.Property(e => e.Addr2)
                    .HasColumnName("ADDR_2")
                    .HasMaxLength(80);

                entity.Property(e => e.Addr3)
                    .HasColumnName("ADDR_3")
                    .HasMaxLength(80);

                entity.Property(e => e.AgencyBranchLevel)
                    .HasColumnName("AGENCY_BRANCH_LEVEL")
                    .HasColumnType("decimal(7, 0)");

                entity.Property(e => e.AgencyCommEligibleFlg)
                    .HasColumnName("AGENCY_COMM_ELIGIBLE_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.AgencyCommPeriod)
                    .HasColumnName("AGENCY_COMM_PERIOD")
                    .HasMaxLength(6);

                entity.Property(e => e.AgencyCommRate)
                    .HasColumnName("AGENCY_COMM_RATE")
                    .HasColumnType("decimal(7, 4)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.AgencyMemberFlg)
                    .HasColumnName("AGENCY_MEMBER_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.AgencyMinMonthPurch)
                    .HasColumnName("AGENCY_MIN_MONTH_PURCH")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.AgencyMinQuarterPurch)
                    .HasColumnName("AGENCY_MIN_QUARTER_PURCH")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.AgencyMinYearPurch)
                    .HasColumnName("AGENCY_MIN_YEAR_PURCH")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.AgencyNetworkRate)
                    .HasColumnName("AGENCY_NETWORK_RATE")
                    .HasColumnType("decimal(7, 4)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.AgencyTreeLayers)
                    .HasColumnName("AGENCY_TREE_LAYERS")
                    .HasColumnType("decimal(7, 0)");

                entity.Property(e => e.AgencyTreeSize)
                    .HasColumnName("AGENCY_TREE_SIZE")
                    .HasColumnType("decimal(9, 0)");

                entity.Property(e => e.AnonymousFlg)
                    .HasColumnName("ANONYMOUS_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('Yes')");

                entity.Property(e => e.Answer1)
                    .HasColumnName("ANSWER_1")
                    .HasMaxLength(80);

                entity.Property(e => e.Answer2)
                    .HasColumnName("ANSWER_2")
                    .HasMaxLength(80);

                entity.Property(e => e.AuditId)
                    .HasColumnName("AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.BusinessId)
                    .HasColumnName("BUSINESS_ID")
                    .HasMaxLength(24);

                entity.Property(e => e.CanCrossMyFolderFlg)
                    .HasColumnName("CAN_CROSS_MY_FOLDER_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.CardExpYyyymmdd)
                    .HasColumnName("CARD_EXP_YYYYMMDD")
                    .HasMaxLength(8)
                    .IsUnicode(false);

                entity.Property(e => e.CardExtNumber)
                    .HasColumnName("CARD_EXT_NUMBER")
                    .HasMaxLength(8);

                entity.Property(e => e.CardHolderCompName)
                    .HasColumnName("CARD_HOLDER_COMP_NAME")
                    .HasMaxLength(48);

                entity.Property(e => e.CardHolderName)
                    .HasColumnName("CARD_HOLDER_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.CardNumber)
                    .HasColumnName("CARD_NUMBER")
                    .HasMaxLength(24);

                entity.Property(e => e.CardType)
                    .HasColumnName("CARD_TYPE")
                    .HasMaxLength(24);

                entity.Property(e => e.CellPhoneNumber)
                    .HasColumnName("CELL_PHONE_NUMBER")
                    .HasMaxLength(36);

                entity.Property(e => e.City)
                    .HasColumnName("CITY")
                    .HasMaxLength(80);

                entity.Property(e => e.CityBorn)
                    .HasColumnName("CITY_BORN")
                    .HasMaxLength(80);

                entity.Property(e => e.CommissionBalance)
                    .HasColumnName("COMMISSION_BALANCE")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CompanyName)
                    .HasColumnName("COMPANY_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.CorpCanDoLibFlg)
                    .HasColumnName("CORP_CAN_DO_LIB_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.CorpCanDoPaymentFlg)
                    .HasColumnName("CORP_CAN_DO_PAYMENT_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.CorpCanDoSetupFlg)
                    .HasColumnName("CORP_CAN_DO_SETUP_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.CorpCanManageOrdersFlg)
                    .HasColumnName("CORP_CAN_MANAGE_ORDERS_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.CorpCanPlaceOrderFlg)
                    .HasColumnName("CORP_CAN_PLACE_ORDER_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.CorpDepartmentName)
                    .HasColumnName("CORP_DEPARTMENT_NAME")
                    .HasMaxLength(36);

                entity.Property(e => e.CorpMgrFlg)
                    .HasColumnName("CORP_MGR_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.Corporate).HasColumnName("CORPORATE");

                entity.Property(e => e.Country).HasColumnName("COUNTRY");

                entity.Property(e => e.CountryName)
                    .HasColumnName("COUNTRY_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.CredentialId)
                    .HasColumnName("CREDENTIAL_ID")
                    .HasMaxLength(50);

                entity.Property(e => e.Currency).HasColumnName("CURRENCY");

                entity.Property(e => e.CurrencyAbbr)
                    .HasColumnName("CURRENCY_ABBR")
                    .HasMaxLength(16);

                entity.Property(e => e.CyOrderCount)
                    .HasColumnName("CY_ORDER_COUNT")
                    .HasColumnType("decimal(7, 0)");

                entity.Property(e => e.CySalesUsd)
                    .HasColumnName("CY_SALES_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.DateAgencyMember)
                    .HasColumnName("DATE_AGENCY_MEMBER")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateCalcAgencyComm)
                    .HasColumnName("DATE_CALC_AGENCY_COMM")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateCalcCommEligible)
                    .HasColumnName("DATE_CALC_COMM_ELIGIBLE")
                    .HasColumnType("date");

                entity.Property(e => e.DateCommissionPaid)
                    .HasColumnName("DATE_COMMISSION_PAID")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateLastAccess)
                    .HasColumnName("DATE_LAST_ACCESS")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateLastLcpLibLimitApproval)
                    .HasColumnName("Date_Last_Lcp_Lib_Limit_Approval")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateLastMultiPageLibLimitApproval)
                    .HasColumnName("Date_Last_MultiPage_Lib_Limit_Approval")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateLastPayment)
                    .HasColumnName("DATE_LAST_PAYMENT")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateLastPrivateLibLimitApproval)
                    .HasColumnName("Date_Last_Private_Lib_Limit_Approval")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateLastPurchae)
                    .HasColumnName("DATE_LAST_PURCHAE")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateLastReferred)
                    .HasColumnName("DATE_LAST_REFERRED")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateMember)
                    .HasColumnName("DATE_MEMBER")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateProMember)
                    .HasColumnName("DATE_PRO_MEMBER")
                    .HasColumnType("datetime");

                entity.Property(e => e.DateStatus)
                    .HasColumnName("DATE_STATUS")
                    .HasColumnType("datetime");

                entity.Property(e => e.District)
                    .HasColumnName("DISTRICT")
                    .HasMaxLength(24);

                entity.Property(e => e.DobYyyymmdd)
                    .HasColumnName("DOB_YYYYMMDD")
                    .HasMaxLength(8)
                    .IsUnicode(false);

                entity.Property(e => e.EducationLevel)
                    .HasColumnName("EDUCATION_LEVEL")
                    .HasMaxLength(24);

                entity.Property(e => e.EmailAddr)
                    .IsRequired()
                    .HasColumnName("EMAIL_ADDR")
                    .HasMaxLength(120);

                entity.Property(e => e.EmployeeMemberFlg)
                    .HasColumnName("Employee_Member_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.EncryptedPswd)
                    .HasColumnName("ENCRYPTED_PSWD")
                    .HasMaxLength(36);

                entity.Property(e => e.FaxNumber)
                    .HasColumnName("FAX_NUMBER")
                    .HasMaxLength(36);

                entity.Property(e => e.FbAgeRangeMin).HasColumnName("FB_Age_Range_Min");

                entity.Property(e => e.FbFirstLoginAt)
                    .HasColumnName("FB_First_Login_At")
                    .HasColumnType("datetime");

                entity.Property(e => e.FbFirstName)
                    .HasColumnName("FB_First_Name")
                    .HasMaxLength(48);

                entity.Property(e => e.FbGender)
                    .HasColumnName("FB_Gender")
                    .HasMaxLength(12);

                entity.Property(e => e.FbId)
                    .HasColumnName("FB_ID")
                    .HasMaxLength(24)
                    .IsUnicode(false);

                entity.Property(e => e.FbLastName)
                    .HasColumnName("FB_Last_Name")
                    .HasMaxLength(48);

                entity.Property(e => e.FbLink)
                    .HasColumnName("FB_Link")
                    .HasMaxLength(400);

                entity.Property(e => e.FbLocale)
                    .HasColumnName("FB_Locale")
                    .HasMaxLength(6)
                    .IsUnicode(false);

                entity.Property(e => e.FbName)
                    .HasColumnName("FB_Name")
                    .HasMaxLength(48);

                entity.Property(e => e.FbNameFormat)
                    .HasColumnName("FB_Name_Format")
                    .HasMaxLength(40);

                entity.Property(e => e.FbPictureIsSilhouetteFlg)
                    .HasColumnName("FB_Picture_Is_Silhouette_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false);

                entity.Property(e => e.FbPictureUrl)
                    .HasColumnName("FB_Picture_URL")
                    .HasMaxLength(400);

                entity.Property(e => e.FbShortName)
                    .HasColumnName("FB_Short_Name")
                    .HasMaxLength(48);

                entity.Property(e => e.FbTimezone)
                    .HasColumnName("FB_Timezone")
                    .HasMaxLength(24)
                    .IsUnicode(false);

                entity.Property(e => e.FbUpdatedTime)
                    .HasColumnName("FB_Updated_Time")
                    .HasColumnType("datetime");

                entity.Property(e => e.FbVerifiedFlg)
                    .HasColumnName("FB_Verified_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false);

                entity.Property(e => e.FirstAuditId)
                    .HasColumnName("FIRST_AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.FirstModified)
                    .HasColumnName("FIRST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.FirstName)
                    .HasColumnName("FIRST_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.FtpIp)
                    .HasColumnName("FTP_IP")
                    .HasMaxLength(48);

                entity.Property(e => e.FtpPswd)
                    .HasColumnName("FTP_PSWD")
                    .HasMaxLength(24);

                entity.Property(e => e.FtpRootFolder)
                    .HasColumnName("FTP_ROOT_FOLDER")
                    .HasMaxLength(80);

                entity.Property(e => e.FtpUserId)
                    .HasColumnName("FTP_USER_ID")
                    .HasMaxLength(24);

                entity.Property(e => e.GoogleEmailVerifiedFlg)
                    .HasColumnName("Google_Email_Verified_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false);

                entity.Property(e => e.GoogleFamilyName)
                    .HasColumnName("Google_Family_Name")
                    .HasMaxLength(48);

                entity.Property(e => e.GoogleFirstLoginAt)
                    .HasColumnName("Google_First_Login_At")
                    .HasColumnType("datetime");

                entity.Property(e => e.GoogleGivenName)
                    .HasColumnName("Google_Given_Name")
                    .HasMaxLength(48);

                entity.Property(e => e.GoogleLocale)
                    .HasColumnName("Google_Locale")
                    .HasMaxLength(6)
                    .IsUnicode(false);

                entity.Property(e => e.GoogleName)
                    .HasColumnName("Google_Name")
                    .HasMaxLength(48);

                entity.Property(e => e.GoogleOpenId)
                    .HasColumnName("Google_Open_ID")
                    .HasMaxLength(80);

                entity.Property(e => e.GooglePictureUrl)
                    .HasColumnName("Google_Picture_URL")
                    .HasMaxLength(400);

                entity.Property(e => e.Guid)
                    .HasColumnName("GUID")
                    .HasMaxLength(36);

                entity.Property(e => e.HashedPswd)
                    .HasColumnName("HASHED_PSWD")
                    .HasMaxLength(80)
                    .IsUnicode(false);

                entity.Property(e => e.InvoiceAddr1)
                    .HasColumnName("Invoice_Addr_1")
                    .HasMaxLength(80);

                entity.Property(e => e.InvoiceAddr2)
                    .HasColumnName("Invoice_Addr_2")
                    .HasMaxLength(80);

                entity.Property(e => e.InvoiceCity)
                    .HasColumnName("Invoice_City")
                    .HasMaxLength(80);

                entity.Property(e => e.InvoiceDistrict)
                    .HasColumnName("Invoice_District")
                    .HasMaxLength(24);

                entity.Property(e => e.InvoiceEmailAddr)
                    .HasColumnName("Invoice_Email_Addr")
                    .HasMaxLength(120);

                entity.Property(e => e.InvoiceHandleType)
                    .HasColumnName("Invoice_Handle_Type")
                    .HasMaxLength(24);

                entity.Property(e => e.InvoiceIndividualMethod)
                    .HasColumnName("Invoice_Individual_Method")
                    .HasMaxLength(24);

                entity.Property(e => e.InvoiceMobileCode)
                    .HasColumnName("Invoice_Mobile_Code")
                    .HasMaxLength(16);

                entity.Property(e => e.InvoiceNaturePersonId)
                    .HasColumnName("Invoice_Nature_Person_ID")
                    .HasMaxLength(24);

                entity.Property(e => e.InvoicePrintType)
                    .HasColumnName("INVOICE_PRINT_TYPE")
                    .HasMaxLength(16);

                entity.Property(e => e.InvoiceShipType)
                    .HasColumnName("INVOICE_SHIP_TYPE")
                    .HasMaxLength(16);

                entity.Property(e => e.InvoiceTitle)
                    .HasColumnName("INVOICE_TITLE")
                    .HasMaxLength(40);

                entity.Property(e => e.JobProfession)
                    .HasColumnName("JOB_PROFESSION")
                    .HasMaxLength(24);

                entity.Property(e => e.JobTitle)
                    .HasColumnName("JOB_TITLE")
                    .HasMaxLength(24);

                entity.Property(e => e.L1MonthAvgSalesUsd)
                    .HasColumnName("L1_MONTH_AVG_SALES_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.L2MonthAvgSalesUsd)
                    .HasColumnName("L2_MONTH_AVG_SALES_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.L3MonthAvgSalesUsd)
                    .HasColumnName("L3_MONTH_AVG_SALES_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.L4MonthAvgSalesUsd)
                    .HasColumnName("L4_MONTH_AVG_SALES_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.L6MonthAvgSalesUsd)
                    .HasColumnName("L6_MONTH_AVG_SALES_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.LastAgencyCommPeriod)
                    .HasColumnName("LAST_AGENCY_COMM_PERIOD")
                    .HasMaxLength(6);

                entity.Property(e => e.LastModified)
                    .HasColumnName("LAST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.LastName)
                    .HasColumnName("LAST_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.LcpLibFolder)
                    .HasColumnName("LCP_LIB_FOLDER")
                    .HasMaxLength(80);

                entity.Property(e => e.LcpLibLimitInMb)
                    .HasColumnName("LCP_LIB_LIMIT_IN_MB")
                    .HasDefaultValueSql("((100))");

                entity.Property(e => e.LcpLibUsageInMb).HasColumnName("LCP_Lib_Usage_In_MB");

                entity.Property(e => e.LifePurchase)
                    .HasColumnName("LIFE_PURCHASE")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.LifePurchaseUsd)
                    .HasColumnName("LIFE_PURCHASE_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.LoginCount)
                    .HasColumnName("LOGIN_COUNT")
                    .HasColumnType("decimal(7, 0)");

                entity.Property(e => e.LyMonthAvgSalesUsd)
                    .HasColumnName("LY_MONTH_AVG_SALES_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.LyOrderCount)
                    .HasColumnName("LY_ORDER_COUNT")
                    .HasColumnType("decimal(7, 0)");

                entity.Property(e => e.LySalesUsd)
                    .HasColumnName("LY_SALES_USD")
                    .HasColumnType("decimal(11, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.MemberClass)
                    .HasColumnName("MEMBER_CLASS")
                    .HasMaxLength(24);

                entity.Property(e => e.MemberId)
                    .HasColumnName("MEMBER_ID")
                    .HasMaxLength(120);

                entity.Property(e => e.MemberNickName)
                    .HasColumnName("MEMBER_NICK_NAME")
                    .HasMaxLength(36);

                entity.Property(e => e.MemberPswd)
                    .HasColumnName("MEMBER_PSWD")
                    .HasMaxLength(24);

                entity.Property(e => e.MemberStatus)
                    .HasColumnName("MEMBER_STATUS")
                    .HasMaxLength(24);

                entity.Property(e => e.MemberType)
                    .HasColumnName("MEMBER_TYPE")
                    .HasMaxLength(36);

                entity.Property(e => e.MiddleInitial)
                    .HasColumnName("MIDDLE_INITIAL")
                    .HasMaxLength(24);

                entity.Property(e => e.MonthlyIncome)
                    .HasColumnName("MONTHLY_INCOME")
                    .HasColumnType("decimal(11, 0)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.MultiPageLibFolder)
                    .HasColumnName("MultiPage_Lib_Folder")
                    .HasMaxLength(80);

                entity.Property(e => e.MultiPageLibLimitInMb).HasColumnName("MultiPage_Lib_Limit_In_MB");

                entity.Property(e => e.MultiPageLibUsageInMb).HasColumnName("MultiPage_Lib_Usage_In_MB");

                entity.Property(e => e.ParentAgencyMember).HasColumnName("PARENT_AGENCY_MEMBER");

                entity.Property(e => e.PaymentMethod)
                    .HasColumnName("PAYMENT_METHOD")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("('Standard')");

                entity.Property(e => e.PermitAdEmailFlg)
                    .HasColumnName("PERMIT_AD_EMAIL_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('Yes')");

                entity.Property(e => e.PhoneNumber)
                    .HasColumnName("PHONE_NUMBER")
                    .HasMaxLength(36);

                entity.Property(e => e.PlaceOrderPswd)
                    .HasColumnName("PLACE_ORDER_PSWD")
                    .HasMaxLength(36);

                entity.Property(e => e.PrivateGalleryId)
                    .HasColumnName("PRIVATE_GALLERY_ID")
                    .HasMaxLength(16);

                entity.Property(e => e.PrivateLibFolder)
                    .HasColumnName("Private_Lib_Folder")
                    .HasMaxLength(80);

                entity.Property(e => e.PrivateLibLimitInMb).HasColumnName("Private_Lib_Limit_In_MB");

                entity.Property(e => e.PrivateLibUsageInMb).HasColumnName("Private_Lib_Usage_In_MB");

                entity.Property(e => e.PrivateTemplateId)
                    .HasColumnName("PRIVATE_TEMPLATE_ID")
                    .HasMaxLength(16);

                entity.Property(e => e.PrivateTextLayoutId)
                    .HasColumnName("PRIVATE_TEXT_LAYOUT_ID")
                    .HasMaxLength(16);

                entity.Property(e => e.ProMemberFlg)
                    .HasColumnName("PRO_MEMBER_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.ProfileHtml)
                    .HasColumnName("Profile_Html")
                    .HasMaxLength(2400);

                entity.Property(e => e.PswdHint)
                    .HasColumnName("PSWD_HINT")
                    .HasMaxLength(80);

                entity.Property(e => e.Question1)
                    .HasColumnName("QUESTION_1")
                    .HasMaxLength(80);

                entity.Property(e => e.Question2)
                    .HasColumnName("QUESTION_2")
                    .HasMaxLength(80);

                entity.Property(e => e.ReferByMemberId)
                    .HasColumnName("REFER_BY_MEMBER_ID")
                    .HasMaxLength(120);

                entity.Property(e => e.ResetToken).HasColumnName("RESET_TOKEN");

                entity.Property(e => e.ResetTokenDate)
                    .HasColumnName("RESET_TOKEN_DATE")
                    .HasColumnType("datetime");

                entity.Property(e => e.ShipAddr1)
                    .HasColumnName("SHIP_ADDR_1")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipAddr2)
                    .HasColumnName("SHIP_ADDR_2")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipAddr3)
                    .HasColumnName("SHIP_ADDR_3")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipCellPhoneNumber)
                    .HasColumnName("SHIP_CELL_PHONE_NUMBER")
                    .HasMaxLength(36);

                entity.Property(e => e.ShipCity)
                    .HasColumnName("SHIP_CITY")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipCompanyName)
                    .HasColumnName("SHIP_COMPANY_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipCountry).HasColumnName("SHIP_COUNTRY");

                entity.Property(e => e.ShipCountryName)
                    .HasColumnName("SHIP_COUNTRY_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipDepartmentName)
                    .HasColumnName("Ship_Department_Name")
                    .HasMaxLength(40);

                entity.Property(e => e.ShipDistrict)
                    .HasColumnName("SHIP_DISTRICT")
                    .HasMaxLength(24);

                entity.Property(e => e.ShipFirstName)
                    .HasColumnName("SHIP_FIRST_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipLastName)
                    .HasColumnName("SHIP_LAST_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipPhoneNumber)
                    .HasColumnName("SHIP_PHONE_NUMBER")
                    .HasMaxLength(36);

                entity.Property(e => e.ShipStateProvince)
                    .HasColumnName("SHIP_STATE_PROVINCE")
                    .HasMaxLength(80);

                entity.Property(e => e.ShipSurname)
                    .HasColumnName("SHIP_SURNAME")
                    .HasMaxLength(12);

                entity.Property(e => e.ShipZipCode)
                    .HasColumnName("SHIP_ZIP_CODE")
                    .HasMaxLength(16);

                entity.Property(e => e.SiteId)
                    .IsRequired()
                    .HasColumnName("Site_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(N'Default')");

                entity.Property(e => e.SkypeId)
                    .HasColumnName("SKYPE_ID")
                    .HasMaxLength(48);

                entity.Property(e => e.SoldDepartmentName)
                    .HasColumnName("Sold_Department_Name")
                    .HasMaxLength(40);

                entity.Property(e => e.SsLast4)
                    .HasColumnName("SS_LAST_4")
                    .HasMaxLength(4);

                entity.Property(e => e.StateProvince)
                    .HasColumnName("STATE_PROVINCE")
                    .HasMaxLength(80);

                entity.Property(e => e.StreetNo)
                    .HasColumnName("STREET_NO")
                    .HasMaxLength(16);

                entity.Property(e => e.Surname)
                    .HasColumnName("SURNAME")
                    .HasMaxLength(12);

                entity.Property(e => e.Tstamp)
                    .IsRequired()
                    .HasColumnName("TStamp")
                    .IsRowVersion();

                entity.Property(e => e.UniqId)
                    .HasColumnName("UNIQ_ID")
                    .HasMaxLength(80);

                entity.Property(e => e.ZipCode)
                    .HasColumnName("ZIP_CODE")
                    .HasMaxLength(16);
            });

            modelBuilder.Entity<WdmMember>(entity =>
            {
                entity.HasKey(e => e.WdmMemberKey);

                entity.ToTable("WDM_Member");

                entity.HasIndex(e => e.Member)
                    .HasName("ix1_WDM_Member");

                entity.HasIndex(e => e.SiteId)
                    .HasName("ix0_WDM_Member");

                entity.Property(e => e.WdmMemberKey).HasColumnName("WDM_Member");

                entity.Property(e => e.ActiveFlg)
                    .HasColumnName("Active_Flg")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('Yes')");

                entity.Property(e => e.AuditId)
                    .HasColumnName("AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.CountFbComment)
                    .HasColumnName("Count_FB_Comment")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CountFbLike)
                    .HasColumnName("Count_FB_Like")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CountFbShare)
                    .HasColumnName("Count_FB_Share")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CountRating)
                    .HasColumnName("Count_Rating")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CountSendToFriends)
                    .HasColumnName("Count_Send_To_Friends")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CountWdmItemUsage)
                    .HasColumnName("Count_WDM_Item_Usage")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CountWdmOrdered)
                    .HasColumnName("Count_WDM_Ordered")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.CountWdmPaid)
                    .HasColumnName("Count_WDM_Paid")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.FirstAuditId)
                    .HasColumnName("FIRST_AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.FirstModified)
                    .HasColumnName("FIRST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.LastCommentAt)
                    .HasColumnName("Last_Comment_At")
                    .HasColumnType("datetime");

                entity.Property(e => e.LastFbLikeAt)
                    .HasColumnName("Last_FB_Like_At")
                    .HasColumnType("datetime");

                entity.Property(e => e.LastFbShareAt)
                    .HasColumnName("Last_FB_Share_At")
                    .HasColumnType("datetime");

                entity.Property(e => e.LastMemberAccessAt)
                    .HasColumnName("Last_Member_Access_At")
                    .HasColumnType("datetime");

                entity.Property(e => e.LastModified)
                    .HasColumnName("LAST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.LastRatingAt)
                    .HasColumnName("Last_Rating_At")
                    .HasColumnType("datetime");

                entity.Property(e => e.LastWdmItemAccessAt)
                    .HasColumnName("Last_WDM_Item_Access_At")
                    .HasColumnType("datetime");

                entity.Property(e => e.MemberRating)
                    .HasColumnName("Member_Rating")
                    .HasColumnType("decimal(7, 3)");

                entity.Property(e => e.SiteId)
                    .HasColumnName("Site_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("('Default')");

                entity.Property(e => e.TotalPaymentAmt)
                    .HasColumnName("Total_Payment_Amt")
                    .HasColumnType("decimal(9, 2)")
                    .HasDefaultValueSql("((0))");

                entity.Property(e => e.Tstamp)
                    .IsRequired()
                    .HasColumnName("TStamp")
                    .IsRowVersion();
            });

            modelBuilder.Entity<Employee>(entity =>
            {
                entity.HasKey(e => e.EmployeeKey);

                entity.ToTable("EMPLOYEE");

                entity.HasIndex(e => e.FirstName)
                    .HasName("ix2_EMPLOYEE");

                entity.HasIndex(e => e.LastName)
                    .HasName("ix1_EMPLOYEE");

                entity.HasIndex(e => e.PhoneNumber)
                    .HasName("ix4_EMPLOYEE");

                entity.HasIndex(e => e.UserId)
                    .HasName("uk1_EMPLOYEE")
                    .IsUnique();

                entity.HasIndex(e => e.ZipCode)
                    .HasName("ix3_EMPLOYEE");

                entity.Property(e => e.EmployeeKey).HasColumnName("EMPLOYEE");

                entity.Property(e => e.Addr1)
                    .HasColumnName("ADDR_1")
                    .HasMaxLength(80);

                entity.Property(e => e.Addr2)
                    .HasColumnName("ADDR_2")
                    .HasMaxLength(80);

                entity.Property(e => e.Addr3)
                    .HasColumnName("ADDR_3")
                    .HasMaxLength(80);

                entity.Property(e => e.AuditId)
                    .HasColumnName("AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.CanDoAdmin)
                    .HasColumnName("CAN_DO_ADMIN")
                    .HasMaxLength(4)
                    .IsUnicode(false);

                entity.Property(e => e.CanDoOrder)
                    .HasColumnName("CAN_DO_ORDER")
                    .HasMaxLength(4)
                    .IsUnicode(false);

                entity.Property(e => e.CanDoPayment)
                    .HasColumnName("CAN_DO_PAYMENT")
                    .HasMaxLength(4)
                    .IsUnicode(false);

                entity.Property(e => e.CanDoService)
                    .HasColumnName("CAN_DO_SERVICE")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('Yes')");

                entity.Property(e => e.CanDoShipment)
                    .HasColumnName("CAN_DO_SHIPMENT")
                    .HasMaxLength(4)
                    .IsUnicode(false);

                entity.Property(e => e.CanSelfApprove)
                    .HasColumnName("CAN_SELF_APPROVE")
                    .HasMaxLength(4)
                    .IsUnicode(false);

                entity.Property(e => e.City)
                    .HasColumnName("CITY")
                    .HasMaxLength(80);

                entity.Property(e => e.Corporate).HasColumnName("CORPORATE");

                entity.Property(e => e.Country).HasColumnName("COUNTRY");

                entity.Property(e => e.CountryName)
                    .HasColumnName("COUNTRY_NAME")
                    .HasMaxLength(80);

                entity.Property(e => e.Currency).HasColumnName("CURRENCY");

                entity.Property(e => e.CurrencyAbbr)
                    .HasColumnName("CURRENCY_ABBR")
                    .HasMaxLength(16);

                entity.Property(e => e.DateStatus)
                    .HasColumnName("DATE_STATUS")
                    .HasColumnType("date");

                entity.Property(e => e.EmailAddr)
                    .HasColumnName("EMAIL_ADDR")
                    .HasMaxLength(120);

                entity.Property(e => e.EmployeeStatus)
                    .HasColumnName("EMPLOYEE_STATUS")
                    .HasMaxLength(24);

                entity.Property(e => e.FaxNumber)
                    .HasColumnName("FAX_NUMBER")
                    .HasMaxLength(36);

                entity.Property(e => e.FirstAuditId)
                    .HasColumnName("FIRST_AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.FirstModified)
                    .HasColumnName("FIRST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.FirstName)
                    .HasColumnName("FIRST_NAME")
                    .HasMaxLength(48);

                entity.Property(e => e.FixedWageFlg)
                    .HasColumnName("FIXED_WAGE_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.FixedWeeklyWage)
                    .HasColumnName("FIXED_WEEKLY_WAGE")
                    .HasColumnType("decimal(9, 2)");

                entity.Property(e => e.HashedPswd)
                    .HasColumnName("HASHED_PSWD")
                    .HasMaxLength(80)
                    .IsUnicode(false);

                entity.Property(e => e.HireDate)
                    .HasColumnName("HIRE_DATE")
                    .HasColumnType("date");

                entity.Property(e => e.HourlyRate)
                    .HasColumnName("HOURLY_RATE")
                    .HasColumnType("decimal(6, 3)");

                entity.Property(e => e.JoinPayrollFlg)
                    .HasColumnName("JOIN_PAYROLL_FLG")
                    .HasMaxLength(4)
                    .IsUnicode(false)
                    .HasDefaultValueSql("('No')");

                entity.Property(e => e.LastModified)
                    .HasColumnName("LAST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.LastName)
                    .HasColumnName("LAST_NAME")
                    .HasMaxLength(48);

                entity.Property(e => e.NameCh)
                    .HasColumnName("NAME_CH")
                    .HasMaxLength(24);

                entity.Property(e => e.NickName)
                    .HasColumnName("NICK_NAME")
                    .HasMaxLength(24);

                entity.Property(e => e.PhoneNumber)
                    .HasColumnName("PHONE_NUMBER")
                    .HasMaxLength(36);

                entity.Property(e => e.ResumeDate)
                    .HasColumnName("RESUME_DATE")
                    .HasColumnType("date");

                entity.Property(e => e.SiteId)
                    .IsRequired()
                    .HasColumnName("Site_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(N'Default')");

                entity.Property(e => e.SsNo)
                    .HasColumnName("SS_NO")
                    .HasMaxLength(36);

                entity.Property(e => e.StateProvince)
                    .HasColumnName("STATE_PROVINCE")
                    .HasMaxLength(80);

                entity.Property(e => e.SuspendDate)
                    .HasColumnName("SUSPEND_DATE")
                    .HasColumnType("date");

                entity.Property(e => e.TerminateDate)
                    .HasColumnName("TERMINATE_DATE")
                    .HasColumnType("date");

                entity.Property(e => e.Title)
                    .HasColumnName("TITLE")
                    .HasMaxLength(36);

                entity.Property(e => e.Tstamp)
                    .IsRequired()
                    .HasColumnName("TStamp")
                    .IsRowVersion();

                entity.Property(e => e.UserId)
                    .IsRequired()
                    .HasColumnName("USER_ID")
                    .HasMaxLength(24);

                entity.Property(e => e.UserLvl)
                    .IsRequired()
                    .HasColumnName("USER_LVL")
                    .HasMaxLength(24);

                entity.Property(e => e.UserPswd)
                    .HasColumnName("USER_PSWD")
                    .HasMaxLength(24);

                entity.Property(e => e.ZipCode)
                    .HasColumnName("ZIP_CODE")
                    .HasMaxLength(16);
            });

            modelBuilder.Entity<CtlParams>(entity =>
            {
                entity.HasKey(e => e.CtlParamsKey);

                entity.ToTable("CTL_PARAMS");

                entity.HasIndex(e => e.Category)
                    .HasName("ix1_CTL_PARAMS");

                entity.HasIndex(e => e.CtlParamId)
                    .HasName("uk1_CTL_PARAMS")
                    .IsUnique();

                entity.Property(e => e.CtlParamsKey).HasColumnName("CTL_PARAMS");

                entity.Property(e => e.AuditId)
                    .HasColumnName("AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.Category)
                    .HasColumnName("CATEGORY")
                    .HasMaxLength(48);

                entity.Property(e => e.CtlParamId)
                    .HasColumnName("CTL_PARAM_ID")
                    .HasMaxLength(80);

                entity.Property(e => e.FirstAuditId)
                    .HasColumnName("FIRST_AUDIT_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(suser_sname())");

                entity.Property(e => e.FirstModified)
                    .HasColumnName("FIRST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.LastModified)
                    .HasColumnName("LAST_MODIFIED")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.ParamValue)
                    .HasColumnName("PARAM_VALUE")
                    .HasMaxLength(360);

                entity.Property(e => e.Remarks)
                    .HasColumnName("REMARKS")
                    .HasMaxLength(120);

                entity.Property(e => e.SiteId)
                    .IsRequired()
                    .HasColumnName("Site_ID")
                    .HasMaxLength(24)
                    .HasDefaultValueSql("(N'Default')");

                entity.Property(e => e.Tstamp)
                    .IsRequired()
                    .HasColumnName("TStamp")
                    .IsRowVersion();
            });
        }
    }
}
