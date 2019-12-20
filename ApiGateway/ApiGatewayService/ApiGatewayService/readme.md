# Microservice installation notes (.NET Core)
* After deploying/copying your files to the root folder you need to test your website/API usig browser or Postman request.

### Potential issues (Error with HTTP status 500):

* Open web.config and try to use a full path to your dotnet.exe file: 
```<aspNetCore processPath="C:\Program Files\dotnet\dotnet.exe" arguments=".\Design.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" />```
* Remove extra arguments like `-argFile IISExeLauncherArgs.txt` if presented and only keep your DLL ```arguments=".\Design.dll"```
* If error is still there then try to run the command manually staying in website's folder:
``` dotnet .\Design.dll```
You should see the error.
* **If you noticed missed DLL** error at previous step and your target framework is .NET Core 2.0.0 the you may need to install shared store. You need to download and install a .NET Core SDK 2.0 (not a runtime and not 2.1 version!) from here: https://www.microsoft.com/net/download/all
* **If you noticed missed DLL (alternative and more comprehensive way):** you may need to publish your project without target manifest. To do so just add the following section into your .csproj file:
    ```xml
    <PropertyGroup>
        <PublishWithAspNetCoreTargetManifest>false</PublishWithAspNetCoreTargetManifest>
    </PropertyGroup>
    ```
    It normally happens when you update or install new packages which rely on newer version of SDK while production normally doesn't have an SDK installed (only runtime)

### If your application is a sub-application on existing website:
* In web.config remove previous handlers like this: 
```xml
    <handlers>
	<remove name="aspNetCore"/>	  	
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModule" resourceType="Unspecified" />	 
    </handlers>
```