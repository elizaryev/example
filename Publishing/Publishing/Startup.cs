using System;
using System.Collections.Generic;
using Apache.Ignite.Core;
using ApiGatewayService.Entities;
using Autofac;
using Autofac.Core;
using Autofac.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Publishing.Repository.Context;
using AutoMapper;
using Gallery.Entities;
using Gallery.Middleware;
using Member.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Publishing.BusinessLogic;
using Publishing.Entities;
using Publishing.Middleware;
using Publishing.Misc;
using Publishing.Repository;
using Serilog;
using Utils.Entities;

namespace Publishing
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public IServiceProvider ConfigureServices(IServiceCollection services)
        {
            services.AddMvc();
            services.AddCors(options =>
            {
                options.AddPolicy("AllowSpecificOrigin",
                    builder => builder.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod().AllowCredentials()
                );
            });

            //services.AddMvc()
            //    .AddJsonOptions(
            //        options => options.SerializerSettings.ReferenceLoopHandling =
            //            Newtonsoft.Json.ReferenceLoopHandling.Ignore
            //    );

            var mappingConfig = new MapperConfiguration(mc =>
            {
                mc.AddProfile(new MappingProfile());
                mc.IgnoreUnmapped();
            });
            IMapper mapper = mappingConfig.CreateMapper();
            services.AddSingleton(mapper);

            var publishingServiceSettings = Configuration.GetSection("PublishingServiceSettings").Get<PublishingServiceSettings>();
            services.AddDbContext<PublishingContext>(
                optionsBuilder =>
                {
                    optionsBuilder.UseSqlServer(publishingServiceSettings.ConnectionString);
                    // todo: in the future, implement with UseSecondLevelCache() with Ignite cache storage as here https://github.com/SteffenMangold/EntityFrameworkCore.Cacheable
                    // todo: or waiting for Ignite to complete the implementation of new packages for EFCore with Linq
                },
                ServiceLifetime.Transient, ServiceLifetime.Transient);

            services.Configure<PublishingServiceSettings>(Configuration.GetSection("PublishingServiceSettings"));
            services.Configure<MemberServiceSettings>(Configuration.GetSection("MemberServiceSettings"));
            services.Configure<TokenManagerServiceSettings>(Configuration.GetSection("TokenManagerServiceSettings"));
            services.Configure<WDMPathResolverSettings>(Configuration.GetSection("PathResolverSettings"));

            services.TryAddSingleton<IHttpContextAccessor, HttpContextAccessor>();


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
            var container = ConfigureServicesSingleInstance(containerBuilder, services);

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

            // for log exception global
            app.UseMiddleware<SerilogMiddleware>();
            app.UseMiddleware<AlertMiddleware>();
            app.UseMiddleware<MemberMiddleware>();

            app.UseCors("AllowSpecificOrigin");
            app.UseMvc();
            
        }

        #region ConfigureServicesInstance

        private IContainer ConfigureServicesSingleInstance
            (ContainerBuilder containerBuilder, IServiceCollection services)
        {
            //var connectionString = "MyConnectionString";
            //var namedParameter = new NamedParameter("connectionString", connectionString);
            //containerBuilder.RegisterType<FakePublishingContext>().As<IPublishingContext>()
            //    .WithParameter(namedParameter).SingleInstance();

            containerBuilder.RegisterType<PublishingService>().As<IPublishingService>().InstancePerDependency(); //.SingleInstance();
            containerBuilder.RegisterType<CategorySevice>().As<ICategorySevice>().InstancePerDependency();//SingleInstance();
            containerBuilder.RegisterType<RatingService>().As<IRatingService>().InstancePerDependency(); //.SingleInstance();
            containerBuilder.RegisterType<OrderService>().As<IOrderService>().InstancePerDependency();//SingleInstance();
            containerBuilder.RegisterType<StgOrderDtl>().As<IStgOrderDtl>().SingleInstance();

            #region Design
            var designServiceSettings = Configuration.GetSection("DesignServiceSettings").Get<DesignServiceSettings>();
            var designServiceUrlParam = new NamedParameter("designServiceUrl", designServiceSettings.DesignServiceUrl);
            var designParameterServiceUrlParam = new NamedParameter("designParameterServiceUrl", designServiceSettings.DesignParameterServiceUrl);
            var designParams = new List<Parameter>();
            designParams.Add(designServiceUrlParam);
            designParams.Add(designParameterServiceUrlParam);
            containerBuilder.RegisterType<DesignClient.DesignService>().As<DesignClient.IDesignService>().WithParameters(designParams).SingleInstance();

            containerBuilder.RegisterType<DesignClient.ProductService>().As<DesignClient.IProductService>()
                .WithParameter("productServiceUrl", designServiceSettings.DesignProductServiceUrl).SingleInstance();

            #endregion Design

            #region Tag
            var tagDesignServiceSettings = Configuration.GetSection("TagDesignServiceSettings").Get<TagDesignServiceSettings>();
            var tagServiceUrlParam = new NamedParameter("tagServiceUrl", tagDesignServiceSettings.TagServiceUrl);
            var tagDesignServiceUrlParam = new NamedParameter("tagDesignServiceUrl", tagDesignServiceSettings.TagDesignServiceUrl);
            var tagParams = new List<Parameter>();
            tagParams.Add(tagServiceUrlParam);
            tagParams.Add(tagDesignServiceUrlParam);
            containerBuilder.RegisterType<TagClient.TagService>().As<TagClient.ITagService>().WithParameters(tagParams).SingleInstance();
            #endregion Tag

            #region --------- GalleryOperationService config ----------
            var galleryServiceSettings = Configuration.GetSection("GAlleryServiceSettings").Get<GalleryServiceSettings>();
            var galleryServiceUrlParam = new NamedParameter("galleryServiceUrl", galleryServiceSettings.GalleryServiceUrl);
            var galleryOperationServiceUrlParam = new NamedParameter("galleryOperationServiceUrl", galleryServiceSettings.GalleryOperationServiceUrl);
            var galleryViewMediaDataServiceUrlParam = new NamedParameter("galleryViewMediaDataServiceUrl", galleryServiceSettings.GalleryViewMediaDataServiceUrl);
            var galleryDesignMediaDataServiceUrlParam = new NamedParameter("galleryDesignMediaDataServiceUrl", galleryServiceSettings.GalleryDesignMediaDataServiceUrl);
            var galleryDesignUploadServiceUrlParam = new NamedParameter("galleryDesignUploadServiceUrl", galleryServiceSettings.GalleryDesignUploadServiceUrl);
            var galleryParams = new List<Parameter>();
            galleryParams.Add(galleryServiceUrlParam);
            galleryParams.Add(galleryViewMediaDataServiceUrlParam);
            galleryParams.Add(galleryDesignMediaDataServiceUrlParam);
            galleryParams.Add(galleryDesignUploadServiceUrlParam);

            containerBuilder.RegisterType<GalleryClient.GalleryService>().As<GalleryClient.IGalleryService>().WithParameters(galleryParams).SingleInstance();
            containerBuilder.RegisterType<GalleryClient.GalleryOperationService>().As<GalleryClient.IGalleryOperationService>().WithParameter(galleryOperationServiceUrlParam).SingleInstance();
            #endregion --------- GalleryOperationService config ----------

            containerBuilder.RegisterType<MemberMiddlewareServiceSettings>().As<IMemberMiddlewareServiceSettings>().SingleInstance();

            #region wdmResource
            var wdmResourcesServiceSettings = Configuration.GetSection("WdmResourcesServiceSettings").Get<WdmResourcesServiceSettings>();
            var wdmResourcesServiceUrlParam = new NamedParameter("wdmResourcesServiceUrl", wdmResourcesServiceSettings.WdmResourcesServiceUrl);
            containerBuilder.RegisterType<WdmResourcesClient.WdmResourcesService>().As<WdmResourcesClient.IWdmResourcesService>()
                .WithParameter(wdmResourcesServiceUrlParam).SingleInstance();
            #endregion wdmResource

            //Plug-In your Autofac builder in ASP.NET Core PIPLINE.
            containerBuilder.Populate(services);

            //Build Autofac container.
            var container = containerBuilder.Build();

            return container;
        }

        #endregion ConfigureServicesInstance
    }
}
