namespace Member.Entities
{
    public class MemberServiceSettings
    {
        public int SaltSize { get; set; }
        public int HashSize { get; set; }
        public int Iterations { get; set; }
        public string ConnectionString { get; set; }
        public string AppCountryPrimaryKey { get; set; }
        public string AppCountryName { get; set; }
    }
}
