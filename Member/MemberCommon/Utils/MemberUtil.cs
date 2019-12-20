using System;

namespace MemberCommon.Utils
{
    public class MemberUtil
    {
        public static string GetMemberFolderName(int memberPKey)
        {
            if (memberPKey > 0)
            {
                return "MBR_" + memberPKey.ToString("D9");
            }

            throw new ArgumentException("Primary key can't be negative!");
        }
    }
}