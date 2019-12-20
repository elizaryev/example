namespace PublishingCommon.Enums
{
    public static class MultiPageDesignTypes
    {
        public const string SINGLE_PAGE = "Single Page";
        public const string SINGLE_PAGE_DB = "Single_Page";
        public const string CROSS_PAGE = "Cross Page";
        public const string CROSS_PAGE_DB = "Cross_Page";
        public const string DESIGN_SET = "Design Set";
        public const string DESIGN_SET_DB = "Design_Set";

        public static string GetDesignTypeByDBValue(string dbDesignType)
        {
            switch (dbDesignType)
            {
                case CROSS_PAGE_DB:
                    return CROSS_PAGE;
                    break;
                case DESIGN_SET_DB:
                    return DESIGN_SET;
                default:
                    return SINGLE_PAGE;
            }
        }
    }
}
