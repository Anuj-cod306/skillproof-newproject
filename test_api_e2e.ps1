try {
    # 1. Test demo-users
    $demoUsers = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/demo-users" -Method GET
    Write-Host "Demo users successfully retrieved:" ($demoUsers | ConvertTo-Json -Compress)

    # 2. Test login
    $loginBody = @{
        email = "anuj@skillproof.edu"
        password = "password123"
        role = "student"
    } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login successful! Token generated:" $loginRes.token.Substring(0, 25)...
    Write-Host "Role:" $loginRes.role "Message:" $loginRes.message

    # 3. Test public passport
    $passport = Invoke-RestMethod -Uri "http://localhost:8080/api/passports/public/SKP-2027-ANUJ-8294" -Method GET
    Write-Host "Passport retrieved for:" $passport.candidateName "Status:" $passport.status "Skills:" $passport.verifiedSkills.Count

    # 4. Test matched jobs
    $jobs = Invoke-RestMethod -Uri "http://localhost:8080/api/jobs/matched" -Method GET
    Write-Host "Matched jobs count:" $jobs.Count "Top job:" $jobs[0].title "Score:" $jobs[0].matchScore

    # 5. Test analytics
    $analytics = Invoke-RestMethod -Uri "http://localhost:8080/api/analytics/demand-vs-availability" -Method GET
    Write-Host "Analytics skills count:" $analytics.Count

    Write-Host "`nALL API COMMUNICATION TESTS PASSED SUCCESSFULLY!"
} catch {
    Write-Host "API test failed:" $_
}
