using System;
using Apache.Ignite.Core;
using AutoMapper;
using Member.Entities;
using Member.Repository.DTO;
using MemberCommon.Model;

namespace Member
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<WdmMemberModel, WdmMember>();
            CreateMap<WdmMember, WdmMemberModel>();

            CreateMap<MemberModel, Repository.DTO.Member>()
                //.ForMember(dest => dest.HashedPswd, opt => opt.Ignore())
                .ForMember(dest => dest.PswdHint, opt => opt.Ignore())
                .ForMember(dest => dest.EncryptedPswd, opt => opt.Ignore())
                .ForMember(dest => dest.FtpPswd, opt => opt.Ignore())
                .ForMember(dest => dest.MemberPswd, opt => opt.Ignore())
                .ForMember(dest => dest.PlaceOrderPswd, opt => opt.Ignore());
            CreateMap<Repository.DTO.Member, MemberModel>()
                //.ForMember(dest => dest.HashedPswd, opt => opt.Ignore())
                .ForMember(dest => dest.PswdHint, opt => opt.Ignore())
                .ForMember(dest => dest.EncryptedPswd, opt => opt.Ignore())
                .ForMember(dest => dest.FtpPswd, opt => opt.Ignore())
                .ForMember(dest => dest.MemberPswd, opt => opt.Ignore())
                .ForMember(dest => dest.PlaceOrderPswd, opt => opt.Ignore());

            CreateMap<EmployeeModel, Employee>()
                .ForMember(dest => dest.HashedPswd, opt => opt.Ignore())
                .ForMember(dest => dest.UserPswd, opt => opt.Ignore());
            CreateMap<Employee, EmployeeModel>()
                .ForMember(dest => dest.HashedPswd, opt => opt.Ignore())
                .ForMember(dest => dest.UserPswd, opt => opt.Ignore());

            //ignite config
            CreateMap<IgniteConfigurationSettings, IgniteConfiguration>();
        }
    }

    public static class MapperExtensions
    {
        private static void IgnoreUnmappedProperties(TypeMap map, IMappingExpression expr)
        {
            foreach (string propName in map.GetUnmappedPropertyNames())
            {
                if (map.SourceType.GetProperty(propName) != null)
                {
                    expr.ForSourceMember(propName, opt => opt.Ignore());
                }
                if (map.DestinationType.GetProperty(propName) != null)
                {
                    expr.ForMember(propName, opt => opt.Ignore());
                }
            }
        }

        public static void IgnoreUnmapped(this IProfileExpression profile)
        {
            profile.ForAllMaps(IgnoreUnmappedProperties);
        }

        public static void IgnoreUnmapped(this IProfileExpression profile, Func<TypeMap, bool> filter)
        {
            profile.ForAllMaps((map, expr) =>
            {
                if (filter(map))
                {
                    IgnoreUnmappedProperties(map, expr);
                }
            });
        }

        public static void IgnoreUnmapped(this IProfileExpression profile, Type src, Type dest)
        {
            profile.IgnoreUnmapped((TypeMap map) => map.SourceType == src && map.DestinationType == dest);
        }

        public static void IgnoreUnmapped<TSrc, TDest>(this IProfileExpression profile)
        {
            profile.IgnoreUnmapped(typeof(TSrc), typeof(TDest));
        }
    }
}