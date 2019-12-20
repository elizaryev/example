using Newtonsoft.Json;
using System;

/// <summary>
/// Summary description for GoogleProfile
/// </summary>
public class GoogleProfile
{
    //Google API is just stupid, I'm getting this from JavaScript instead
    /*[JsonProperty(PropertyName = "open_id")]*/
    public string OpenId { get; set; }

    public string Email { get; set; }

    [JsonProperty(PropertyName = "email_verified")]
    public bool EmailVerified { get; set; }

    public string Name { get; set; }

    public Uri Picture { get; set; }

    [JsonProperty(PropertyName = "given_name")]
    public string GivenName { get; set; }

    [JsonProperty(PropertyName = "family_name")]
    public string FamilyName { get; set; }

    public string Locale { get; set; }


    //Following fields are part of the Google "signature" when verifying the token

    public Uri Iss { get; set; }

    public string Sub { get; set; }

    //Actually an URL but I prefer to store it as a string
    public string Azp { get; set; }

    //Actually an URL but I prefer to store it as a string
    //This one should contain our app Client ID otherwise it means the token is not valid
    public string Aud { get; set; }

    //Ticks (UNIX time)
    public string Iat { get; set; }

    //Ticks (UNIX time)
    public string Exp { get; set; }
}