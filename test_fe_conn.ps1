try {
    $res = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "Localhost 3000 StatusCode: $($res.StatusCode)"
    Write-Host "Content preview: $($res.Content.Substring(0, [Math]::Min(200, $res.Content.Length)))"
} catch {
    Write-Host "Localhost 3000 Error: $_"
}

try {
    $res2 = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "127.0.0.1:3000 StatusCode: $($res2.StatusCode)"
} catch {
    Write-Host "127.0.0.1:3000 Error: $_"
}
