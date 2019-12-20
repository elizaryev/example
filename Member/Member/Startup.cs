using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using Apache.Ignite.Core;
using Apache.Ignite.Core.Cache.Configuration;
using Apache.Ignite.Core.Discovery.Tcp;
using Apache.Ignite.Core.Discovery.Tcp.Static;
using Apache.Ignite.Core.Events;
using Apache.Ignite.Core.Lifecycle;
using Autofac;
using Autofac.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using AutoMapper;
using Microsoft.Extensions.Logging;
using Serilog;
using Member.BusinessLogic;
using Member.Entities;
using Member.Middleware;
using Member.Misc;
using Member.Repository;
using Member.Repository.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.WindowsAzure.Storage.Table;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Member
{
    public class Startup
    {
        public Startup(IConfiguration configuration, IHostingEnvironment env)
        {
            Configuration = configuration;
            CurrentEnvironment = env;
        }

        public IConfiguration Configuration { get; }
        private IHostingEnvironment CurrentEnvironment { get; set; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public IServiceProvider ConfigureServices(IServiceCollection services)
        {
            services.AddMvc()
                .AddJsonOptions((options) => options.SerializerSettings.NullValueHandling = NullValueHandling.Ignore);
           
            services.AddCors(options =>
            {
                options.AddPolicy("AllowSpecificOrigin",
                    builder => builder.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod().AllowCredentials()
                );
            });

            var mappingConfig = new MapperConfiguration(mc =>
            {
                mc.AddProfile(new MappingProfile());
                mc.IgnoreUnmapped();
            });
            IMapper mapper = mappingConfig.CreateMapper();
            services.AddSingleton(mapper);

            services.Configure<IgniteConfigurationSettings>(Configuration.GetSection("IgniteConfiguration"));
            services.Configure<GoogleSettings>(Configuration.GetSection("GoogleSettings"));
            services.Configure<FacebookSettings>(Configuration.GetSection("FacebookSettings"));
            services.Configure<MemberServiceSettings>(Configuration.GetSection("MemberServiceSettings"));
            var memberServiceSettings = Configuration.GetSection("MemberServiceSettings").Get<MemberServiceSettings>();
            services.AddDbContext<MemberContext>(
                optionsBuilder =>
                {
                    optionsBuilder.UseSqlServer(memberServiceSettings.ConnectionString);
                    // todo: in the future, implement with UseSecondLevelCache() with Ignite cache storage as here https://github.com/SteffenMangold/EntityFrameworkCore.Cacheable
                    // todo: or waiting for Ignite to complete the implementation of new packages for EFCore with Linq
                },
                ServiceLifetime.Transient, ServiceLifetime.Transient);

            #region init Ignite
            var igniteSettings = Configuration.GetSection("IgniteConfiguration").Get<IgniteConfigurationSettings>();
            var ic = mapper.Map<IgniteConfiguration>(igniteSettings);
            // hack - something adjust hands
            ic.DiscoverySpi = new Apache.Ignite.Core.Discovery.Tcp.TcpDiscoverySpi
            {
                IpFinder = new Apache.Ignite.Core.Discovery.Tcp.Static.TcpDiscoveryStaticIpFinder
                {
                    Endpoints = igniteSettings.DiscoverySpi.IpFinder.Endpoints
                },
                SocketTimeout = igniteSettings.DiscoverySpi.SocketTimeout
            };
            ic.LifecycleHandlers = new[] { new IgniteLifecycleHandler() };

            CachedQueryableExtensions.Init(ic);
            CachedRepository.Init(ic);
            #endregion init Ignite

            //Create Autofac ContainerBuilder 
            var containerBuilder = new ContainerBuilder();
            var container = ConfigureServicesSingleInstance(containerBuilder, services, mapper);

            //Create Autofac Service Provider & assign Autofac container 
            var autofacServiceProvider = new AutofacServiceProvider(container);

            //Finally return Autofac Service Provider.
            return autofacServiceProvider;
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            loggerFactory.AddSerilog();

            app.UseMiddleware<SerilogMiddleware>();

            app.UseCors("AllowSpecificOrigin");
            app.UseMvc();
        }

        #region ConfigureServicesInstance

        private IContainer ConfigureServicesSingleInstance
            (ContainerBuilder containerBuilder, IServiceCollection services, IMapper mapper)
        {
            containerBuilder.RegisterType<MemberService>().As<IMemberService>().InstancePerDependency(); //SingleInstance();
            containerBuilder.RegisterType<SecurePasswordHasher>().As<ISecurePasswordHasher>().SingleInstance();

            var publishingServiceSettings = Configuration.GetSection("PublishingServiceSettings").Get<PublishingServiceSettings>();
            var ratingServiceUrlParam = new NamedParameter("ratingServiceUrl", publishingServiceSettings.RatingServiceUrl);
            containerBuilder.RegisterType<PublishingClient.RatingService>().As<PublishingClient.IRatingService>()
                .WithParameter(ratingServiceUrlParam).SingleInstance();

            //Plug-In your Autofac builder in ASP.NET Core PIPLINE.
            containerBuilder.Populate(services);

            //Build Autofac container.
            var container = containerBuilder.Build();

            return container;
        }

        #endregion ConfigureServicesInstance
    }
}
