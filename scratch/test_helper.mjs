async function test() {
  const ts = Date.now();
  const reg = await fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'cand_' + ts,
      email: 'cand_' + ts + '@test.com',
      password: 'password123',
      fullName: 'Proctored Test Candidate',
      role: 'student',
      college: 'JNU Jaipur',
      degree: 'B.Tech CS',
      targetRole: 'Full Stack Engineer'
    })
  }).then(r => r.json());
  console.log('Registered candidate:', reg.email, 'Token:', reg.token?.substring(0, 15));

  // Initialize skills
  const skillsRes = await fetch('http://localhost:8080/api/student/skills', {
    headers: { 'Authorization': 'Bearer ' + reg.token }
  }).then(r => r.json());
  console.log('Initialized skills count:', skillsRes.length);

  // Available assessments
  const assessRes = await fetch('http://localhost:8080/api/student/assessments/available', {
    headers: { 'Authorization': 'Bearer ' + reg.token }
  }).then(r => r.json());
  console.log('Available assessments count:', assessRes.length, assessRes.map(a => a.skillName));
}

test().catch(console.error);
