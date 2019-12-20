namespace Gallery.Entities
{
    public interface IMemberMiddlewareServiceSettings
    {
        MemberServiceSettings MemberServiceSettingsValue { get; }
        TokenManagerServiceSettings TokenManagerServiceSettingsValue { get; }
    }
}
