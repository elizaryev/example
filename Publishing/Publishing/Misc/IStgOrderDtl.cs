using System.Threading.Tasks;
using DesignCommon.Model;
using MemberCommon.Model;

namespace Publishing.Misc
{
    public interface IStgOrderDtl
    {
        Task<Repository.DTO.StgOrderDtl> CreateStgOrderDtl(string orderStage, string dtlType, int price, int optnPrice,
            ProdTypeOptnModel prodTypeOptn, ProdModel prodModel, MemberModel memberInfo, int orderQty, int printQty,
            int prodTypeKey, int currDtlLineNbr, string language);
    }
}