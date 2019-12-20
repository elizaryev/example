using System.Collections.Generic;
using ApiGatewayCommon;
using MemberCommon.Enum;

namespace MemberClient.Receiver
{
    public class ReceiverFactory
    {
        private readonly Dictionary<int, IReceiverFlyweight<ICmdResult, ICommandParameters>> _receivers = new Dictionary<int, IReceiverFlyweight<ICmdResult, ICommandParameters>>();

        public ReceiverFactory(string memberServiceUrl, string wdmMemberServiceUrl, string employeeServiceUrl)
        {
            _receivers.Add(ActionType.GetMemberInfo, new GetUserInfoReceiverFlyweight(memberServiceUrl));
            _receivers.Add(ActionType.GetWdmMemberInfo, new GetWdmMemberReceiverFlyweight(wdmMemberServiceUrl));
            _receivers.Add(ActionType.Verify, new VerifyReceiverFlyweight(memberServiceUrl));
            _receivers.Add(ActionType.GetEmplInfo, new GetEmployeeInfoReceiverFlyweight(employeeServiceUrl));
            _receivers.Add(ActionType.VerifyEmpl, new VerifyEmplReceiverFlyweight(employeeServiceUrl));
            _receivers.Add(ActionType.UpdateWdmMember, new UpdateWdmMemberReceiverFlyweight(wdmMemberServiceUrl));
            _receivers.Add(ActionType.GetFBProfile, new GetFBProfileReceiverFlyweight(memberServiceUrl));
            _receivers.Add(ActionType.GetMemberInfoByFbId, new GetUserInfoByFbIdReceiverFlyweight(memberServiceUrl));
            _receivers.Add(ActionType.CreateMember, new CreateMemberReceiverFlyweight(memberServiceUrl));
            _receivers.Add(ActionType.GetFBProfileEmail, new GetFBProfileEmailCmdReceiverFlyweight(memberServiceUrl));
            _receivers.Add(ActionType.UpdateFacebookProfile, new UpdateFacebookReceiverFlyweight(memberServiceUrl));
            _receivers.Add(ActionType.VerifyGooleToken, new VerifyGoogleTokenReceiverFlyweight(memberServiceUrl));
            _receivers.Add(ActionType.GetGoogleProfile, new GetGoogleProfileReceiverFlyweight(memberServiceUrl));
            _receivers.Add(ActionType.UpdateGoogleProfile, new UpdateGoogleProfileReceiverFlyweight(memberServiceUrl));
        }

        public IReceiverFlyweight<ICmdResult, ICommandParameters> GetReceiver(int actionType)
        {
            return _receivers[actionType];
        }
    }
}