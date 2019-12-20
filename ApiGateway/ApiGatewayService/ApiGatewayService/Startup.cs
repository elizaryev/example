using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ApiGatewayService.AuthorizationRequirement;
using ApiGatewayService.BusinessLogic;
using ApiGatewayService.Entities;
using ApiGatewayService.Middleware;
using AspNetCore.Proxy;
using Autofac;
using Autofac.Core;
using Autofac.Extensions.DependencyInjection;
using AutoMapper;
using DesignClient;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using PublishingClient;
using Serilog;
using TagClient;
using IProductService = ApiGatewayService.BusinessLogic.IProductService;
using ProductService = ApiGatewayService.BusinessLogic.ProductService;

namespace ApiGatewayService
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
            services.AddMvc()
                .AddJsonOptions((options) => options.SerializerSettings.NullValueHandling = NullValueHandling.Ignore);

            services.AddAutoMapper();
            services.AddCors(options =>
            {
                options.AddPolicy("AllowSpecificOrigin",
                    builder => builder.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod().AllowCredentials()
                );
            });

            services.AddAuthorization(options =>
            {
                options.AddPolicy("IsMember", policy =>
                    policy.Requirements.Add(new MemberRequirement()));
            });

            services.Configure<GatewayContextSettings>(Configuration.GetSection("GatewayContextSettings"));
            services.Configure<AuthenticationSettings>(Configuration.GetSection("AuthenticationSettings"));
            services.Configure<MemberServiceSettings>(Configuration.GetSection("MemberServiceSettings"));
            services.Configure<TokenManagerServiceSettings>(Configuration.GetSection("TokenManagerServiceSettings"));

            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
            services.AddSingleton<IAuthorizationHandler, MemberAuthorizationHandler>();

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

            #region ------ Proxies to upload design item/gallery item --------

            var galleryServiceSettings = Configuration.GetSection("GalleryServiceSettings").Get<GalleryServiceSettings>();
            var galleryServiceHostDev = new NamedParameter("galleryServiceHostDev", galleryServiceSettings.GalleryServiceHostDev);
            var galleryServiceHost = new NamedParameter("galleryServiceHost", galleryServiceSettings.GalleryServiceHost);

            var host = env.IsDevelopment() ? galleryServiceHostDev.Value : galleryServiceHost.Value;
            app.UseProxy("api/designupload/{*hash}", (args) =>
                Task.FromResult($"{host}/api/designupload/{args["hash"]}"));

            app.UseProxy("api/itemupload/{*hash}", (args) =>
                Task.FromResult($"{host}/api/itemupload/{args["hash"]}"));
            #endregion

            loggerFactory.AddSerilog();

            // for log exception global
            app.UseMiddleware<SerilogMiddleware>();
            app.UseMiddleware<AlertMiddleware>();

            app.UseCors("AllowSpecificOrigin");

            app.UseMvc();
        }

        #region ConfigureServicesInstance

        private IContainer ConfigureServicesSingleInstance
            (ContainerBuilder containerBuilder, IServiceCollection services)
        {
            containerBuilder.RegisterType<PublishingService>().As<IPublishingService>().SingleInstance();
            containerBuilder.RegisterType<DesignService>().As<IDesignService>().SingleInstance();
            containerBuilder.RegisterType<ProductService>().As<IProductService>().SingleInstance();
            containerBuilder.RegisterType<GalleryService>().As<IGalleryService>().SingleInstance();
            containerBuilder.RegisterType<TagService>().As<ITagService>().SingleInstance();
            containerBuilder.RegisterType<ParserService>().As<IParserService>().SingleInstance();
            containerBuilder.RegisterType<GatewayService>().As<IGatewayService>().SingleInstance();
            containerBuilder.RegisterType<MemberService>().As<IMemberService>().SingleInstance();
            containerBuilder.RegisterType<CategorySevice>().As<ICategorySevice>().SingleInstance();
            containerBuilder.RegisterType<RatingService>().As<IRatingService>().SingleInstance();
            containerBuilder.RegisterType<BusinessLogic.MiniHelper>().As<BusinessLogic.IMiniHelper>().SingleInstance();
            containerBuilder.RegisterType<BusinessLogic.WdmResourcesService>().As<BusinessLogic.IWdmResourcesService>().SingleInstance();


            var designServiceSettings = Configuration.GetSection("DesignServiceSettings").Get<DesignServiceSettings>();
            var designServiceUrlParam = new NamedParameter("designServiceUrl", designServiceSettings.DesignServiceUrl);
            var designParameterServiceUrlParam = new NamedParameter("designParameterServiceUrl", designServiceSettings.DesignParameterServiceUrl);
            var designParams = new List<Parameter>();
            designParams.Add(designServiceUrlParam);
            designParams.Add(designParameterServiceUrlParam);
            containerBuilder.RegisterType<DesignClient.DesignService>().As<DesignClient.IDesignService>().WithParameters(designParams).SingleInstance();

            containerBuilder.RegisterType<DesignClient.ProductService>().As<DesignClient.IProductService>()
                .WithParameter("productServiceUrl", designServiceSettings.DesignProductServiceUrl).SingleInstance();

            containerBuilder.RegisterType<DesignClient.MiniHelper>().As<DesignClient.IMiniHelper>()
                .WithParameter("miniHelperServiceUrl", designServiceSettings.MiniHelperServiceUrl).SingleInstance();

            #region --------- GalleryService config ----------
            var galleryServiceSettings = Configuration.GetSection("GAlleryServiceSettings").Get<GalleryServiceSettings>();
            var galleryServiceUrlParam = new NamedParameter("galleryServiceUrl", galleryServiceSettings.GalleryServiceUrl);
            var galleryItemServiceUrlParam = new NamedParameter("galleryItemServiceUrl", galleryServiceSettings.GalleryItemServiceUrl);
            var galleryOperationServiceUrlParam = new NamedParameter("galleryOperationServiceUrl", galleryServiceSettings.GalleryOperationServiceUrl);
            var galleryViewMediaDataServiceUrlParam = new NamedParameter("galleryViewMediaDataServiceUrl", galleryServiceSettings.GalleryViewMediaDataServiceUrl);
            var galleryDesignMediaDataServiceUrlParam = new NamedParameter("galleryDesignMediaDataServiceUrl", galleryServiceSettings.GalleryDesignMediaDataServiceUrl);
            var galleryDesignUploadServiceUrlParam = new NamedParameter("galleryDesignUploadServiceUrl", galleryServiceSettings.GalleryDesignUploadServiceUrl);
            var galleryParams = new List<Parameter>();
            galleryParams.Add(galleryServiceUrlParam);
            galleryParams.Add(galleryItemServiceUrlParam);
            galleryParams.Add(galleryViewMediaDataServiceUrlParam);
            galleryParams.Add(galleryDesignMediaDataServiceUrlParam);
            galleryParams.Add(galleryDesignUploadServiceUrlParam);

            containerBuilder.RegisterType<GalleryClient.GalleryService>().As<GalleryClient.IGalleryService>().WithParameters(galleryParams).SingleInstance();
            containerBuilder.RegisterType<GalleryClient.GalleryOperationService>().As<GalleryClient.IGalleryOperationService>().WithParameter(galleryOperationServiceUrlParam).SingleInstance();
            #endregion --------- GalleryService config ----------

            #region Tag
            var tagDesignServiceSettings = Configuration.GetSection("TagDesignServiceSettings").Get<TagDesignServiceSettings>();
            var tagServiceUrlParam = new NamedParameter("tagServiceUrl", tagDesignServiceSettings.TagServiceUrl);
            var tagDesignServiceUrlParam = new NamedParameter("tagDesignServiceUrl", tagDesignServiceSettings.TagDesignServiceUrl);
            var tagParams = new List<Parameter>();
            tagParams.Add(tagServiceUrlParam);
            tagParams.Add(tagDesignServiceUrlParam);
            containerBuilder.RegisterType<TagClient.TagService>().As<TagClient.ITagService>().WithParameters(tagParams).SingleInstance();
            #endregion Tag

            var publishingServiceSettings = Configuration.GetSection("PublishingServiceSettings").Get<PublishingServiceSettings>();
            var publishingServiceUrlParam = new NamedParameter("publishingServiceUrl", publishingServiceSettings.PublishingServiceUrl);
            containerBuilder.RegisterType<PublishingClient.PublishingService>().As<PublishingClient.IPublishingService>()
                .WithParameter(publishingServiceUrlParam).SingleInstance();

            var categoryServiceUrlParam = new NamedParameter("categoryServiceUrl", publishingServiceSettings.CategoryServiceUrl);
            var subcategoryServiceUrlParam = new NamedParameter("subcategoryServiceUrl", publishingServiceSettings.SubcategoryServiceUrl);
            var categoriesParams = new List<Parameter>();
            categoriesParams.Add(categoryServiceUrlParam);
            categoriesParams.Add(subcategoryServiceUrlParam);
            containerBuilder.RegisterType<PublishingClient.CategorySevice>().As<PublishingClient.ICategorySevice>()
                .WithParameters(categoriesParams).SingleInstance();

            var ratingServiceUrlParam = new NamedParameter("ratingServiceUrl", publishingServiceSettings.RatingServiceUrl);
            containerBuilder.RegisterType<PublishingClient.RatingService>().As<PublishingClient.IRatingService>()
                .WithParameter(ratingServiceUrlParam).SingleInstance();

            var orderServiceUrlParam = new NamedParameter("orderServiceUrl", publishingServiceSettings.OrderServiceUrl);
            containerBuilder.RegisterType<PublishingClient.OrderService>().As<PublishingClient.IOrderService>()
                .WithParameter(orderServiceUrlParam).SingleInstance();

            var parserServiceSettings = Configuration.GetSection("ParserServiceSettings").Get<ParserServiceSettings>();
            var parserRenderServiceUrlParam = new NamedParameter("parserServiceUrl", parserServiceSettings.ParserRenderServiceUrl);
            containerBuilder.RegisterType<ParserClient.ParserService>().As<ParserClient.IParserService>()
                .WithParameter(parserRenderServiceUrlParam).SingleInstance();

            var parserDefaultRenderingPageUrlParam = new NamedParameter("parserDefaultRenderingPageUrl", parserServiceSettings.ParserDefaultRenderingPageUrl);
            containerBuilder.RegisterType<ParserService>().As<IParserService>()
                .WithParameter(parserDefaultRenderingPageUrlParam).SingleInstance();

            var wdmResourcesServiceSettings = Configuration.GetSection("WdmResourcesServiceSettings").Get<WdmResourcesServiceSettings>();
            var wdmResourcesServiceUrlParam = new NamedParameter("wdmResourcesServiceUrl", wdmResourcesServiceSettings.WdmResourcesServiceUrl);
            containerBuilder.RegisterType<WdmResourcesClient.WdmResourcesService>().As<WdmResourcesClient.IWdmResourcesService>()
                .WithParameter(wdmResourcesServiceUrlParam).SingleInstance();

            //Plug-In your Autofac builder in ASP.NET Core PIPLINE.
            containerBuilder.Populate(services);

            //Build Autofac container.
            var container = containerBuilder.Build();

            return container;
        }

        #endregion ConfigureServicesInstance
    }
}
