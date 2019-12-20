using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ParserClient.Model;

namespace ApiGatewayService.BusinessLogic
{
    public interface IParserService
    {
        Task<List<ParserResult>> Render(ParserData parserData);
    }
}