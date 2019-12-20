dotnet pack

rem Alex dev
rem d:\ALEX\WORK\NuGet\nuget.exe push D:\ALEX\WORK\WIT\Microservices\Publishing\PublishingClient\bin\Debug\PublishingClient.1.0.83.nupkg oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:9000/nuget
rem d:\ALEX\WORK\NuGet\nuget.exe push D:\ALEX\WORK\WIT\Microservices\Publishing\PublishingCommon\bin\Debug\PublishingCommon.1.0.36.nupkg oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:9000/nuget
pause


rem Alex master version
rem c:\nuget\nuget.exe push D:\ALEX\WORK\WIT\Microservices\Publishing\PublishingClient\bin\Release\PublishingClient.1.10.4.nupkg oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:9000/nuget
rem c:\nuget\nuget.exe push D:\ALEX\WORK\WIT\Microservices\Publishing\PublishingCommon\bin\Release\PublishingCommon.1.10.1.nupkg oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:9000/nuget

rem Vasily dev
c:\Development\NuGet\nuget.exe push "C:\Development\wdm\microservices\Publishing\PublishingClient\bin\Debug\PublishingClient.1.0.84.nupkg" oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:4554/nuget
c:\Development\NuGet\nuget.exe push "C:\Development\wdm\microservices\Publishing\PublishingCommon\bin\Debug\PublishingCommon.1.0.37.nupkg" oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:4554/nuget

rem Scaffold-DbContext "Server=yp2012sql.cloudapp.net;Database=YPDEVDBB;Integrated Security=False;User Id=Alex;Password=NUYSz9bcw69K2sv4;MultipleActiveResultSets=True;Connection Timeout=30;Pooling=true;Enlist=true;Connection Lifetime=0;Min Pool Size=10;Max Pool Size=120;" Microsoft.EntityFrameworkCore.SqlServer -outputDir Repository\DTO -table dbo.Unit_Measure