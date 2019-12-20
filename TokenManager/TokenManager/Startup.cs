using System;
using Autofac;
using Autofac.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using AutoMapper;
using Microsoft.Extensions.Logging;
using Serilog;
using TokenManager.BussinessLogic;
using TokenManager.Context;
using TokenManager.Entities;
using TokenManager.Middleware;

namespace TokenManager
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
            services.AddAutoMapper();
            services.AddCors(options =>
            {
                options.AddPolicy("AllowSpecificOrigin",
                    builder => builder.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod().AllowCredentials()
                );
            });

            services.Configure<TokenManagerServiceSettings>(Configuration.GetSection("TokenManagerServiceSettings"));

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

            app.UseMiddleware<SerilogMiddleware>();

            app.UseCors("AllowSpecificOrigin");
            app.UseMvc();
        }

        #region ConfigureServicesInstance

        private IContainer ConfigureServicesSingleInstance
            (ContainerBuilder containerBuilder, IServiceCollection services)
        {
            containerBuilder.RegisterType<TokenManagerService>().As<ITokenManagerService>().SingleInstance();
            containerBuilder.RegisterType<FileDumpStorageContext>().As<IDumpStorageContext>().SingleInstance();

            //Plug-In your Autofac builder in ASP.NET Core PIPLINE.
            containerBuilder.Populate(services);

            //Build Autofac container.
            var container = containerBuilder.Build();

            return container;
        }

        #endregion ConfigureServicesInstance
    }
}
