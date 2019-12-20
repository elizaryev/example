dotnet pack
rem c:\Development\NuGet\nuget.exe push C:\Development\wdm\Microservices\Gallery\GalleryClient\bin\Debug\GalleryClient.1.10.7.nupkg oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:4554/nuget
c:\Development\NuGet\nuget.exe push C:\Development\wdm\apigateway\ApiGatewayService\ApiGatewayCommon\bin\Debug\ApiGatewayCommon.1.0.7.nupkg oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:4554/nuget


rem Alex local
d:\ALEX\WORK\NuGet\nuget.exe push d:\ALEX\WORK\WIT\ApiGateway\ApiGatewayService\ApiGatewayCommon\bin\Debug\ApiGatewayCommon.1.0.7.nupkg oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:9000/nuget

pause
