import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testAssess() {
  const ts = Date.now();
  const email = `test_assess_${ts}@test.com`;
  const reg = await fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `u_${ts}`,
      email,
      password: 'password123',
      fullName: 'Test Candidate',
      role: 'student',
      college: 'JNU Jaipur',
      degree: 'B.Tech CS',
      targetRole: 'Full Stack Engineer'
    })
  }).then(r => r.json());

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--auto-select-desktop-capture-source=Entire screen',
      '--window-size=1440,900'
    ]
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/#/', { waitUntil: 'networkidle2' });
  await page.evaluate((token, em) => {
    const u = { id: 999, email: em, name: 'Test Candidate', role: 'student', token };
    localStorage.setItem('skillproof_token', token);
    localStorage.setItem('skillproof_user', JSON.stringify(u));
  }, reg.token, email);

  await page.goto('http://localhost:3000/#/student/assessments', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#btn-open-diagnostic-preflight', { timeout: 10000 });
  await page.click('#btn-open-diagnostic-preflight');
  await page.waitForSelector('#card-assessment-preflight', { timeout: 10000 });

  const initialStartDisabled = await page.$eval('#btn-start-proctored-session', el => el.disabled);
  console.log('Initial Start Disabled:', initialStartDisabled);

  // Set permissions
  await page.evaluate(() => {
    window.__skillproofProctor.setPermissions({ camera: true, microphone: true, screen: true });
  });
  await new Promise(r => setTimeout(r, 800));

  const afterPerms = await page.evaluate(() => {
    const cam = document.getElementById('status-proctor-camera')?.innerText;
    const mic = document.getElementById('status-proctor-mic')?.innerText;
    const screen = document.getElementById('status-proctor-screen')?.innerText;
    const btnDisabled = document.getElementById('btn-start-proctored-session')?.disabled;
    return { cam, mic, screen, btnDisabled };
  });
  console.log('After permissions:', afterPerms);

  await browser.close();
}

testAssess().catch(console.error);
