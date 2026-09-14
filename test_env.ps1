$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot"
$env:PATH = "$($env:JAVA_HOME)\bin;C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2025.2.1\plugins\maven\lib\maven3\bin;C:\Windows\System32;C:\Windows;$env:PATH"

Write-Host "Testing Java:"
& "$env:JAVA_HOME\bin\java.exe" -version

Write-Host "`nTesting Maven:"
& "C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2025.2.1\plugins\maven\lib\maven3\bin\mvn.cmd" -version
