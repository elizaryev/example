using System.Collections.Generic;
using System.Threading.Tasks;
using PublishingCommon.Model;

namespace Publishing.BusinessLogic
{
    public interface IRatingService
    {
        Task<int> Save(WdmRatingModel itemData);
        /// <summary>
        /// For getting a rating value by member how exposed and who set the value
        /// </summary>
        /// <param name="rater"></param>
        /// <param name="appointment"></param>
        /// <returns></returns>
        Task<WdmRatingModel> GetRating(string rater, string appointment);
        Task<List<WdmRatingModel>> GetRatingList(string appointment);
        Task<bool> UpdateRating(WdmRatingModel itemData);
    }
}