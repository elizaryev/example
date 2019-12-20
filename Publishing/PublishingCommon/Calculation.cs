using System.Collections.Generic;

namespace PublishingCommon
{
    public class Calculation
    {
        public static decimal RatingValue(List<short?> ratingList)
        {
            // (PrevCount * RatingValue + Rating) / CurrentCount 
            decimal ratingValue = 0;
            int prevCount = 0;
            int currentCount = 1;
            foreach (var rating in ratingList)
            {
                ratingValue = (prevCount * ratingValue + (rating ?? 0)) / currentCount;
                prevCount = currentCount;
                currentCount++;
            }
            return ratingValue; 
        }
    }
}
