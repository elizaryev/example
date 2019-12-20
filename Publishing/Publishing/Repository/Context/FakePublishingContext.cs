using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Publishing.Repository.DTO;

namespace Publishing.Repository.Context
{
    public class FakePublishingContext : IPublishingContext
    {
        private static readonly List<WdmItem> PublishingTable = new List<WdmItem>();

        private string _connectionString;
        public FakePublishingContext(string connectionString)
        {
            _connectionString = connectionString;
        }

        //public async Task<int> Save(WdmItem itemDTO)
        //{
        //    //pseudo asynchronous
        //    async Task<int> Function()
        //    {
        //        if (PublishingTable.Any(a => a.ItemName == itemDTO.ItemName))
        //            return itemDTO.WdmItemKey;

        //        itemDTO.PublishDate = DateTime.Now.ToString();
        //        var lastItem = PublishingTable.LastOrDefault();
        //        if (lastItem != null)
        //        {
        //            itemDTO.WdmItemKey = lastItem.WdmItemKey;
        //            itemDTO.WdmItemKey++;
        //        }
        //        PublishingTable.Add(itemDTO);
        //        return itemDTO.WdmItemKey;
        //    }

        //    return await Function();
        //}

        //public async Task<bool> Remove(int wdmItem)
        //{
        //    async Task<bool> Function()
        //    {
        //        var item = PublishingTable.FirstOrDefault(f => f.WDMItem == wdmItem);
        //        if (item != null)
        //        {
        //            PublishingTable.Remove(item);
        //        }

        //        return true;
        //    }
        //    return await Function();
        //}

        //public async Task<WDMItemDTO> GetPublished(int WDMItem)
        //{
        //    async Task<WDMItemDTO> Function()
        //    {
        //        return PublishingTable.FirstOrDefault(f => f.WDMItem == WDMItem);
        //    }
        //    return await Function();
        //}

        //public async Task<List<WDMItemDTO>> GetPublishedList()
        //{
        //    async Task<List<WDMItemDTO>> Function()
        //    {
        //        return PublishingTable;
        //    }
        //    return await Function();
        //}
    }
}
