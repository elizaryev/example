//using System;
//using System.Threading.Tasks;
//using MemberClient.Command;
//using MemberClient.Receiver;
//using MemberCommon.CommandParam;
//using Xunit;

//namespace MemberTest
//{
//    public class MemberUnitTest
//    {
//        // for Mock interface
//        static MemberUnitTest()
//        {

//        }

//        [Fact]
//        public void Member_InvalidArguments_ThrowsArgumentException()
//        {
//            // Arrange
//            // Act
//            // Assert
//        }

//        /// <summary>
//        /// </summary>
//        /// <param name="inputParameter"></param>
//        /// <returns></returns>
//        [InlineData("alex@youprint.com.tw", "qpCpSrpzxrRYkK62")]
//        [Theory]
//        public async Task Member_Success_Login(string emailAddr, string hashedPswd)
//        {
//            Receiver _receiver = new Receiver("http://localhost:5555/api/Member/", "http://localhost:5555/api/WdmMember/"); // for IIS Express running 50555
//            var getCmdParam = new GetMemberInfoCmdParams() { EmailAddress = emailAddr };
//            var getCmd = new GetMemberInfoCmd(_receiver, getCmdParam);

//            var member = await getCmd.Execute();
//            Assert.False(member == null);

//            var verifyCmdParam = new VerifyCmdParams() { emailAddress = emailAddr, password = hashedPswd };
//            var verifyCmd = new VerifyCmd(_receiver, verifyCmdParam);

//            var credentials = await verifyCmd.Execute();
//            Assert.True(credentials);
//        }

//        /// <summary>
//        /// </summary>
//        /// <param name="wdmMember"></param>
//        /// <returns></returns>
//        [InlineData(1)]
//        [Theory]
//        public async Task Get_Member_Success_By_WdmMemebr(int wdmMember)
//        {
//            Receiver receiver = new Receiver("http://localhost:5555/api/Member/", "http://localhost:5555/api/WdmMember/"); // for IIS Express running 50555
//            var getCmdParam = new GetMemberInfoCmdParams() { Member = wdmMember };
//            var getCmd = new GetMemberInfoCmd(receiver, getCmdParam);

//            var member = await getCmd.Execute();
//            Assert.False(member == null);
//        }

//        [InlineData(1)]
//        [Theory]
//        public async Task Get_WDMMember_Success(int wdmMember)
//        {
//            Receiver receiver = new Receiver("http://localhost:50555/api/Member/", "http://localhost:50555/api/WdmMember/"); // for IIS Express running 50555
//            var getCmdParam = new GetWdmMemberInfoCmdParams() { WdmMember = wdmMember };
//            var getCmd = new GetWdmMemberInfoCmd(receiver, getCmdParam);

//            var member = await getCmd.Execute();
//            Assert.False(member == null);
//        }
//    }
//}
