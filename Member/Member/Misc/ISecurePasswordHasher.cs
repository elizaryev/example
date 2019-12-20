namespace Member.Misc
{
    public interface ISecurePasswordHasher
    {
        string Hash(string password);
        bool Verify(string password, string hashedPassword);
    }
}