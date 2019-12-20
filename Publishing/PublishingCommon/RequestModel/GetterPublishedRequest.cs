namespace PublishingCommon.RequestModel
{
    public class GetterPublishedRequest
    {
        public bool OnlyMember { get; set; }
        public string WdmCategoryId { get; set; }
        public int? Start { get; set; }
        public int? Take { get; set; }
        public int? ProdType { get; set; }
        public string SizeDimension { get; set; }
        public string SizeMatching { get; set; }
        public bool FreeStyle { get; set; }
        public decimal? SizeHeightDesign { get; set; }
        public decimal? SizeWidthDesign { get; set; }
        public int? ProdTypeOptnDtlKey { get; set; }

        public GetterPublishedRequest()
        {
            OnlyMember = false;
        }

        public bool Valid()
        {
            return true;
        }
    }
}
