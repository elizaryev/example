using System;
using System.Collections.Generic;
using System.Linq;
using ApiGatewayService.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using Newtonsoft.Json.Linq;
using Serilog;
using Utils;

namespace ApiGatewayService.Misc
{
    public static class Helper
    {
        public static string GetRequestIP(HttpContext context, bool tryUseXForwardHeader = true)
        {
            string ip = null;

            // todo support new "Forwarded" header (2014) https://en.wikipedia.org/wiki/X-Forwarded-For

            // X-Forwarded-For (csv list):  Using the First entry in the list seems to work
            // for 99% of cases however it has been suggested that a better (although tedious)
            // approach might be to read each IP from right to left and use the first public IP.
            if (tryUseXForwardHeader)
                ip = GetHeaderValueAs<string>(context, "X-Forwarded-For").SplitCsv().FirstOrDefault();

            // RemoteIpAddress is always null in DNX RC1 Update1 (bug).
            if (ip.IsNullOrWhitespace() && context?.Connection?.RemoteIpAddress != null)
                ip = context.Connection.RemoteIpAddress.ToString();

            if (ip.IsNullOrWhitespace())
                ip = GetHeaderValueAs<string>(context, "REMOTE_ADDR");

            // _httpContextAccessor.HttpContext?.Request?.Host this is the local host.
            if (ip.IsNullOrWhitespace())
                throw new Exception("Unable to determine caller's IP.");

            return ip;
        }

        public static T GetHeaderValueAs<T>(HttpContext context, string headerName)
        {
            StringValues values;

            if (context?.Request?.Headers?.TryGetValue(headerName, out values) ?? false)
            {
                string rawValues = values.ToString();   // writes out as Csv when there are multiple.

                if (!rawValues.IsNullOrWhitespace())
                    return (T)Convert.ChangeType(values.ToString(), typeof(T));
            }
            return default(T);
        }

        public static List<string> SplitCsv(this string csvList, bool nullOrWhitespaceInputReturnsNull = false)
        {
            if (string.IsNullOrWhiteSpace(csvList))
                return nullOrWhitespaceInputReturnsNull ? null : new List<string>();

            return csvList
                .TrimEnd(',')
                .Split(',')
                .AsEnumerable<string>()
                .Select(s => s.Trim())
                .ToList();
        }

        public static bool IsNullOrWhitespace(this string s)
        {
            return String.IsNullOrWhiteSpace(s);
        }

        public static StringValues GetTokenValue(HttpRequest request, out bool anonymous)
        {
            StringValues token;
            anonymous = false;
            bool hasTokenKey = request.Headers.ContainsKey("token");
            if (!hasTokenKey)
            {
                anonymous = true;
            }

            if (hasTokenKey)
            {
                token = request.Headers["token"];
                string tokenVal = token.ToString();
                anonymous = (tokenVal == "null" || tokenVal == "");
            }

            return token;
        }

        public static bool LogOutReset(LCPSessionCtl LCPSession)
        {
            string uniqId = string.Empty;
            try
            {
                uniqId = LCPSession.GetAVar("Uniq_Id");

                // reset Member and MyFolder session variables
                // THe YP site version
                //Session["Member_Logged_In_Flag"] = "No";
                //Session["Member_Nick_Name"] = "";
                //Session["Agency_Member_Flag"] = "";

                // if already logged in, set "Login OK" to home page to avoid going to previous member's page;
                // otherwise (not logged in yet),  "Login OK" (or after New Member signup) shall return to whatever set previously (by BaseReqLoginNoRtnUrl.cs, for example)
                if (LCPSession.GetAVar("Member_Logged_In_Flag") == "Yes")
                {
                    LCPSession.SetAVar("Login_OkReturnURL", "~/Default.aspx", false);
                    LCPSession.SetAVar("Login_CancelReturnURL", "~/Default.aspx", false);
                }

                LCPSession.SetAVar("Member_Logged_In_Flag", "No", false);
                LCPSession.SetAVar("Member_Nick_Name", "", false);
                LCPSession.SetAVar("Member_PKey", "", false);
                LCPSession.SetAVar("Pro_Member_Flag", "", false);
                LCPSession.SetAVar("_Mbr", "", false);
                LCPSession.SetAVar("Employee_Member_Flg", "No", false);
                LCPSession.SetAVar("Act_As_Member", "No", false);
                LCPSession.SetAVar("Agency_Member_Flag", "", false);
                LCPSession.SetAVar("Member_Uniq_Id", "", false);

                //this.LCPSession.SetAVar("Emp_Login_Ok_ReturnURL", "~/Web/OMS/Default.aspx", false);
                LCPSession.SetAVar("ReturnURL", "~/Default.aspx", false);

                LCPSession.SetAVar("MyFolderCurrentPath", "", false);
                LCPSession.SetAVar("MyFolderActionDepth", "", false);
                LCPSession.SetAVar("MyFolderReturnURL", "", true);

                // call AfterLogout() general method - to clear out RememberMe cookie
                //utilHelper.AfterLogout(this.Request, this.Response);

                LCPSession.SyncCommitAllVars();
                return true;
            }
            catch (Exception e)
            {
                Log.Error(e, $"Error sign out YP site for uniqId:[{uniqId}]");
                return false;
            }
        }

        public static LoginParameters GetLoginParameters(JObject data)
        {
            var loginParameters = new LoginParameters();
            try
            {
                loginParameters = data["loginParameters"].ToObject<LoginParameters>();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "");

                loginParameters.CartOrderId = string.Empty;
                loginParameters.RememberMe = true;
                loginParameters.YPSessionTimeout = 40;
                loginParameters.YPUICulture = "en-US";
            }

            return loginParameters;
        }

        public static Dictionary<string, object> GetLoginDict(JObject data)
        {
            var loginDict = new Dictionary<string, object>();
            try
            {
                var loginParameters = data["loginParameters"];
                foreach (var item in loginParameters)
                {
                    if (item is JProperty jProperty)
                    {
                        loginDict.Add(jProperty.Name, jProperty.Value);
                    }
                }
            }
            catch (Exception ex)
            {
                Log.Error(ex, "");
            }

            return loginDict;
        }        
    }

    public class TokenGeneratorParameters
    {
        public string UserId { get; set; }
        public Dictionary<string, object> LoginDictionary { get; set; }
        public DateTime Expire { get; set; }
    }
}
