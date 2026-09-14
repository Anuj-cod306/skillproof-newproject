async function check() {
  const login = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'leooo@gmail.com', password: 'password123' })
  }).then(r => r.json());

  console.log('Login successful for leooo');

  const avail = await fetch('http://localhost:8080/api/student/assessments/available', {
    headers: { 'Authorization': 'Bearer ' + login.token }
  }).then(r => r.json());
  console.log('Available assessments count for leooo:', avail.length);
  if (avail.length > 0) {
    console.log('First subject:', avail[0].skillName);
  }

  const latest = await fetch('http://localhost:8080/api/student/assessments/latest', {
    headers: { 'Authorization': 'Bearer ' + login.token }
  }).then(r => r.status === 200 ? r.json() : null);
  console.log('Latest assessment for leooo:', latest ? latest.status : 'None');
}

check().catch(console.error);
