using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Apache.Ignite.Core;
using Apache.Ignite.Core.Discovery;
using Apache.Ignite.Core.Discovery.Tcp;

namespace Member.Entities
{
    public class IgniteConfigurationSettings
    {
        public string IgniteHome { get; set; }
        public string WorkDirectory { get; set; }
        public string Localhost { get; set; }
        public List<int> IncludedEventTypes { get; set; }
        public TcpDiscoverySpi DiscoverySpi { get; set; }
        public List<CacheConfiguration> CacheConfiguration { get; set; }
    }

    public class CacheConfiguration
    {
        public int CacheMode { get; set; }
        public int Backups { get; set; }
        public string Name { get; set; }
    }

    public class TcpDiscoverySpi : IDiscoverySpi
    {
        public int LocalPort { get; set; }
        public TcpDiscoveryStaticIpFinder IpFinder { get; set; }
        public TimeSpan SocketTimeout { get; set; }
    }

    public class TcpDiscoveryStaticIpFinder: ITcpDiscoveryIpFinder
    {
        public List<string> Endpoints { get; set; }
    }
}
