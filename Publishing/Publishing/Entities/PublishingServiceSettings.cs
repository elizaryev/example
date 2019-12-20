namespace Publishing.Entities
{
    public class PublishingServiceSettings
    {
        public string ConnectionString { get; set; }
        public string LogTextHandlerEmployee { get; set; }
        public string LCPSessionNetworkServerPath { get; set; }
        public string LCPCartPath { get; set; }
        //TODO:this parameter should be a part of member table. Ask Jay to add it to the Database
        public string MemberDesignRepository { get; set; }
        // TODO: mb needed read from session YP
        public string Language { get; set; }
    }
}
