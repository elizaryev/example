using Microsoft.Extensions.Options;

namespace Gallery.Entities
{
    public class MemberMiddlewareServiceSettings : IMemberMiddlewareServiceSettings
    {
        public MemberMiddlewareServiceSettings(IOptions<TokenManagerServiceSettings> tokenManagerServiceSettings,
            IOptions<MemberServiceSettings> memberServiceSettings)
        {
            TokenManagerServiceSettingsValue = tokenManagerServiceSettings.Value;
            MemberServiceSettingsValue = memberServiceSettings.Value;
        }

        public MemberServiceSettings MemberServiceSettingsValue { get; }

        public TokenManagerServiceSettings TokenManagerServiceSettingsValue { get; }
    }
}
