const res = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'leooo@gmail.com', password: 'password123' })
});
const data = await res.json();
console.log('Login response keys:', Object.keys(data));
console.log('Login response data:', data);

const meRes = await fetch('http://localhost:8080/api/auth/me', {
  headers: { 'Authorization': 'Bearer ' + data.token }
});
console.log('Me status:', meRes.status);
if (meRes.ok) {
  const me = await meRes.json();
  console.log('Me data:', me);
} else {
  console.log('Me error:', await meRes.text());
}
