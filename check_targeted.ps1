$mvnPath = (Get-ChildItem -Path "C:\Program Files\JetBrains" -Filter "mvn.cmd" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
Write-Host "Maven in JetBrains: $mvnPath"

$pgService = Get-Service | Where-Object { $_.Name -like "*postgres*" -or $_.DisplayName -like "*postgres*" }
Write-Host "Postgres Service: $($pgService | Out-String)"

$pgDir = Get-ChildItem -Path "C:\Program Files\PostgreSQL" -ErrorAction SilentlyContinue
Write-Host "Postgres Dir: $($pgDir | Out-String)"

$connections = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
Write-Host "Port 5432 status: $($connections | Out-String)"
