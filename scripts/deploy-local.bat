cd ../src/
dotnet publish VirtualCockpit.SocksForms/VirtualCockpit.SocksForms.csproj -c Release -p:PublishProfile=FolderProfile
cd VirtualCockpit.Angular
call npm install
call npm run build
cd ..

del c:\roaming\apps\vcockpit\host\*.dll
del c:\roaming\apps\vcockpit\host\*.exe
del c:\roaming\apps\vcockpit\host\*.pdb
del c:\roaming\apps\vcockpit\host\wwwroot\*.html
del c:\roaming\apps\vcockpit\host\wwwroot\*.js
del c:\roaming\apps\vcockpit\host\wwwroot\*.css

xcopy /e /v /y VirtualCockpit.SocksForms\bin\Release\net6.0-windows\win-x64\publish c:\roaming\apps\vcockpit\host
xcopy /e /v /y VirtualCockpit.Angular\dist\virtual-cockpit c:\roaming\apps\vcockpit\host\wwwroot

REM PAUSE
