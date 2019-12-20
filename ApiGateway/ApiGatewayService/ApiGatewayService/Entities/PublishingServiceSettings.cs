namespace ApiGatewayService.Entities
{
    public class PublishingServiceSettings
    {
        public string PublishingServiceUrl { get; set; }
        public string CategoryServiceUrl { get; set; }
        public string SubcategoryServiceUrl { get; set; }
        public string RatingServiceUrl { get; set; }
        public string OrderServiceUrl { get; set; }
        public string ApiKey { get; set; }
    }
}
