namespace ApiGatewayService.Entities
{
    public class AuthenticationSettings
    {
        public bool Enabled { get; set; }
        public string SecretKey { get; set; }
        public string TokenExpiresMin { get; set; }
        public string LCPSessionNetworkServerPath { get; set; }
    }
}
