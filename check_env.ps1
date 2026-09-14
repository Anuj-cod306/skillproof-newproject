Write-Host "=== CHECKING SYSTEM ENVIRONMENT ==="

Write-Host "`n--- PATH Directories ---"
$env:PATH -split ';' | ForEach-Object { if (Test-Path $_) { Write-Host $_ } }

Write-Host "`n--- Searching for Java ---"
$javaDirs = @(
    "C:\Program Files\Java",
    "C:\Program Files (x86)\Java",
    "C:\Program Files\Eclipse Adoptium",
    "C:\Program Files\Microsoft",
    "C:\Program Files\Amazon Corretto",
    "C:\Program Files\Zulu",
    "C:\Users\Dell\.jdks",
    "C:\Users\Dell\AppData\Local\Programs"
)
foreach ($d in $javaDirs) {
    if (Test-Path $d) {
        Write-Host "Found directory: $d"
        Get-ChildItem -Path $d -Recurse -Filter "java.exe" -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_.FullName }
    }
}

Write-Host "`n--- Searching for Maven ---"
$mvnDirs = @(
    "C:\Program Files",
    "C:\tools",
    "C:\Users\Dell\AppData\Local\Programs",
    "C:\Users\Dell\.m2"
)
foreach ($d in $mvnDirs) {
    if (Test-Path $d) {
        Get-ChildItem -Path $d -Recurse -Filter "mvn.cmd" -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_.FullName }
    }
}

Write-Host "`n--- Checking Services for PostgreSQL / Database ---"
Get-Service | Where-Object { $_.DisplayName -match 'postgre|sql' -or $_.Name -match 'postgre|sql' } | Format-Table Name, Status, DisplayName

Write-Host "`n--- Checking Port 5432 and 8080 and 3000 ---"
Get-NetTCPConnection -LocalPort 5432, 8080, 3000 -ErrorAction SilentlyContinue | Format-Table LocalPort, State, OwningProcess
