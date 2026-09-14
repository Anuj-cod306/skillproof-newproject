$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot"
$env:PATH = "$($env:JAVA_HOME)\bin;C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2025.2.1\plugins\maven\lib\maven3\bin;C:\Windows\System32;C:\Windows;$env:PATH"

Set-Location "C:\Users\Dell\.gemini\antigravity\scratch\skillproof\backend"
& "C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2025.2.1\plugins\maven\lib\maven3\bin\mvn.cmd" spring-boot:run
