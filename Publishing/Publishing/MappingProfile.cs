using System;
using AutoMapper;
using Publishing.Repository.DTO;
using PublishingCommon.Model;

namespace Publishing
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<WdmItem, WdmItemModel>(); //.ForMember(dest => dest.TagDesignList, opt => opt.Ignore()); 
            CreateMap<WdmItemModel, WdmItem>();

            CreateMap<WdmRating, WdmRatingModel>();
            CreateMap<WdmRatingModel, WdmRating>();

            CreateMap<WdmCategory, WdmCategoryModel>();
            CreateMap<WdmCategoryModel, WdmCategory>();

            CreateMap<WdmSubCategory, WdmSubCategoryModel>();
            CreateMap<WdmSubCategoryModel, WdmSubCategory>();

            CreateMap<WdmItemLog, WdmItemLogModel>();
            CreateMap<WdmItemLogModel, WdmItemLog>();

            CreateMap<StgOrderDtl, StgOrderDtlModel>();
            CreateMap<StgOrderDtlModel, StgOrderDtl>();
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
