using DesignCommon.Model;

namespace PublishingCommon.RequestModel
{
    public class CreatingMyCartRequest
    {
        public string SourceHash;
        public int Price;
        public int OptnPrice;
        public ProdTypeOptnModel ProdTypeOptn;
        public ProdModel ProdData;
        public int OrderQty;
        public int PrintQty;
        public int ProdTypeKey;
        public string ProdTypeId;
        public bool HasCoverMaterial;
        public bool HasPageMaterial;
        public string JsonDesignParams;
    }
}
