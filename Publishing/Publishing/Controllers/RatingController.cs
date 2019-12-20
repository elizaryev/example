using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Publishing.BusinessLogic;
using PublishingCommon.Model;

namespace Publishing.Controllers
{
    [EnableCors("AllowSpecificOrigin")]
    [Produces("application/json")]
    [Route("api/Rating")]
    public class RatingController : Controller
    {
        private readonly IRatingService _ratingService;

        public RatingController(IRatingService ratingService)
        {
            _ratingService = ratingService;
        }

        [HttpPost("create")]
        public async Task<int> SaveRating([FromBody] WdmRatingModel ratingData)
        {
            return await _ratingService.Save(ratingData);
        }

        [HttpGet("{appointment}/{rater}")]
        public async Task<WdmRatingModel> GetRating(string appointment, string rater)
        {
            return await _ratingService.GetRating(rater, appointment);
        }

        [HttpGet("{appointment}")]
        public async Task<List<WdmRatingModel>> GetRatingList(string appointment)
        {
            return await _ratingService.GetRatingList(appointment);
        }

        [HttpPost]
        public async Task<bool> UpdateRating([FromBody] WdmRatingModel ratingData)
        {
            return await _ratingService.UpdateRating(ratingData);
        }
    }
}
