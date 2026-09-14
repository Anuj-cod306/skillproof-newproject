async function run() {
  const base = 'http://localhost:8080/api';
  console.log('1. Public Passport Verification...');
  const pubRes = await fetch(base + '/passports/public/SKP-2027-2100320100045-5435');
  const pubData = await pubRes.json();
  console.log('Public Verifier OK. Candidate: ' + pubData.studentName + ', College: ' + pubData.college);

  console.log('2. Industry Candidate Search...');
  const cRes = await fetch(base + '/industry/candidates?skill=Java&minReadiness=0');
  const cData = await cRes.json();
  const first = Array.isArray(cData) && cData.length > 0 ? cData[0].fullName : 'None';
  console.log('Candidate Search OK. Count: ' + (Array.isArray(cData) ? cData.length : 0) + ', First: ' + first);
}
run().catch(console.error);