dotnet pack

rem Alex version of dev
c:\nuget\nuget.exe push D:\ALEX\WORK\WIT\Microservices\TokenManager\TokenManagerClient\bin\Debug\TokenManagerClient.1.0.8.nupkg oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:9000/nuget
c:\nuget\nuget.exe push D:\ALEX\WORK\WIT\Microservices\TokenManager\TokenManagerCommon\bin\Debug\TokenManagerCommon.1.0.7.nupkg oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:9000/nuget

rem Alex version of MASTER
c:\nuget\nuget.exe push D:\ALEX\WORK\WIT\Microservices\TokenManager\TokenManagerClient\bin\Release\TokenManagerClient.1.10.4.nupkg oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:9000/nuget
c:\nuget\nuget.exe push D:\ALEX\WORK\WIT\Microservices\TokenManager\TokenManagerCommon\bin\Release\TokenManagerCommon.1.10.3.nupkg oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:9000/nuget


c:\Development\NuGet\nuget.exe push "C:\Development\wdm\microservices\TokenManager\TokenManagerClient\bin\Debug\TokenManagerClient.1.10.4.nupkg" oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:4554/nuget
c:\Development\NuGet\nuget.exe push "C:\Development\wdm\microservices\TokenManager\TokenManagerCommon\bin\Debug\TokenManagerCommon.1.10.3.nupkg" oy2oybuntjq66bankggav2pg64t5qtoencrnhzimi7d6ri -Source http://localhost:4554/nuget


pause
