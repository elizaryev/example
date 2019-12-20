dotnet pack

rem Alex version
c:\nuget\nuget.exe push D:\ALEX\WORK\WIT\Microservices\Member\MemberClient\bin\Debug\MemberClient.1.0.28.nupkg oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:9000/nuget
c:\nuget\nuget.exe push D:\ALEX\WORK\WIT\Microservices\Member\MemberCommon\bin\Debug\MemberCommon.1.0.19.nupkg oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:9000/nuget

rem Master version
rem c:\nuget\nuget.exe push D:\ALEX\WORK\WIT\Microservices\Member\MemberClient\bin\Release\MemberClient.1.10.2.nupkg oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:9000/nuget
rem c:\nuget\nuget.exe push D:\ALEX\WORK\WIT\Microservices\Member\MemberCommon\bin\Release\MemberCommon.1.10.1.nupkg oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:9000/nuget

rem Vasily version
c:\Development\NuGet\nuget.exe push "C:\Development\wdm\microservices\Member\MemberClient\bin\Debug\MemberClient.1.1.1.nupkg" oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:4554/nuget
c:\Development\NuGet\nuget.exe push "C:\Development\wdm\microservices\Member\MemberCommon\bin\Debug\MemberCommon.1.1.1.nupkg" oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:4554/nuget

rem Microsoft.EntityFrameworkCore
rem Microsoft.EntityFrameworkCore.Design
rem Microsoft.EntityFrameworkCore.SqlServer
rem Scaffold-DbContext "Server=yp2012sql.cloudapp.net;Database=YPDEVDBB;Integrated Security=False;User Id=Alex;Password=NUYSz9bcw69K2sv4;MultipleActiveResultSets=True;Connection Timeout=30;Pooling=true;Enlist=true;Connection Lifetime=0;Min Pool Size=10;Max Pool Size=120;" Microsoft.EntityFrameworkCore.SqlServer -outputDir DTO -table dbo.MEMBER, dbo.WDM_Member

pause
