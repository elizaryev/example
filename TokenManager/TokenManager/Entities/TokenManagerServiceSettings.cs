namespace TokenManager.Entities
{
    public class TokenManagerServiceSettings
    {
        public string SecretKey { get; set; }
        public string TokenExpiresMin { get; set; }
        public string ValidIssuer { get; set; }
        public string ValidAudience { get; set; }
        public string DumpFolder { get; set; }
        public string DumpFile { get; set; }
    }
}
