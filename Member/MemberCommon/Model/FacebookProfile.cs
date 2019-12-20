using System;
using Newtonsoft.Json;

namespace MemberCommon.Model
{
    public class FacebookProfile
    {
        public string Id { get; set; }

        public Cover Cover { get; set; }

        public string Name { get; set; }

        [JsonProperty(PropertyName = "first_name")]
        public string FirstName { get; set; }

        [JsonProperty(PropertyName = "last_name")]
        public string LastName { get; set; }

        [JsonProperty(PropertyName = "short_name")]
        public string ShortName { get; set; }

        [JsonProperty(PropertyName = "age_range")]
        public AgeRange AgeRange { get; set; }

        [JsonProperty(PropertyName = "name_format")]
        public string NameFormat { get; set; }

        public Uri Link { get; set; }

        public string Gender { get; set; }

        public string Locale { get; set; }

        public Picture Picture { get; set; }

        public int Timezone { get; set; }

        [JsonProperty(PropertyName = "updated_time")]
        public DateTime UpdatedTime { get; set; }

        public bool Verified { get; set; }

        public string Email { get; set; }
    }

    public class Cover
    {
        public string Id { get; set; }

        [JsonProperty(PropertyName = "offset_x")]
        public int OffsetX { get; set; }

        [JsonProperty(PropertyName = "offset_y")]
        public int OffsetY { get; set; }

        public string Source { get; set; }
    }

    public class AgeRange
    {
        public int Min { get; set; }
    }

    public class Picture
    {
        public Data Data { get; set; }
    }

    public class Data
    {
        [JsonProperty(PropertyName = "is_silhouette")]
        public bool IsSilhouette { get; set; }

        public Uri Url { get; set; }
    }
}
