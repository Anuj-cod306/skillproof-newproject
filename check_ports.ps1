Get-NetTCPConnection -LocalPort 3000, 8080 -ErrorAction SilentlyContinue | Format-Table LocalAddress, LocalPort, State, OwningProcess
