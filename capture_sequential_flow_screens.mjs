import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\75f051e4-6a8a-41a8-8441-18517c19c29f';
const BASE_URL = 'http://localhost:3000/#';
const API_URL = 'http://localhost:8080/api';

async function capture() {
  const ts = Date.now();
  const candidateEmail = `seq_cand_${ts}@skillproof.edu`;
  const regRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `seq_${ts}`,
      email: candidateEmail,
      password: 'password123',
      fullName: 'Sequential Candidate',
      role: 'student',
      college: 'JNU jaipur college',
      degree: 'B.Tech Computer Science',
      targetRole: 'Full Stack Engineer'
    })
  });
  const authData = await regRes.json();

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
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await page.evaluate((token, email) => {
    const user = {
      id: 8888,
      userId: 8888,
      profileId: 8888,
      email: email,
      name: 'Sequential Candidate',
      username: 'seq_cand',
      role: 'student',
      college: 'JNU jaipur college',
      degree: 'B.Tech Computer Science',
      targetRole: 'Full Stack Engineer',
      token: token
    };
    localStorage.setItem('skillproof_token', token);
    localStorage.setItem('skillproof_user', JSON.stringify(user));
    localStorage.setItem('skillproof_student_token', token);
    localStorage.setItem('skillproof_student_user', JSON.stringify(user));
  }, authData.token, candidateEmail);

  // Navigate to AI Interview Arena
  await page.goto(`${BASE_URL}/student/ai-interview`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#card-mode-technical', { timeout: 15000 });

  // 1. Capture Step 1: Pre-Flight
  await page.evaluate(async () => {
    if (window.__skillproofMedia) {
      await window.__skillproofMedia.setAllPermissions(true);
    }
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'step1_preflight.png') });
  console.log('Saved step1_preflight.png');

  // 2. Start Arena -> Step 2: AI Technical Interview
  await page.click('#btn-start-arena');
  await page.waitForSelector('#card-active-question', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'step2_technical_interview.png') });
  console.log('Saved step2_technical_interview.png');

  // 3. Transition to Step 3: INTERVIEW_COMPLETE
  await page.evaluate(() => {
    localStorage.setItem('skillproof_assessment_stage', 'INTERVIEW_COMPLETE');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('#btn-continue-to-coding', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'step3_interview_complete.png') });
  console.log('Saved step3_interview_complete.png');

  // 4. Click Continue to Coding Test -> Step 4: CODING
  await page.click('#btn-continue-to-coding');
  await page.waitForSelector('#textarea-code-editor', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'step4_coding_contest.png') });
  console.log('Saved step4_coding_contest.png');

  // 5. Run Test cases in Coding Contest
  await page.click('#btn-run-code');
  await page.waitForSelector('#panel-test-results', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'step4_coding_test_results.png') });
  console.log('Saved step4_coding_test_results.png');

  // 6. Transition to Step 5: EVALUATION
  await page.evaluate(() => {
    localStorage.setItem('skillproof_assessment_stage', 'EVALUATION');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'step5_evaluation.png') });
  console.log('Saved step5_evaluation.png');

  // 7. Transition to Step 6: RESULT
  await page.evaluate(() => {
    localStorage.setItem('skillproof_assessment_stage', 'RESULT');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('#stat-overall-score', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'step6_result_dossier.png') });
  console.log('Saved step6_result_dossier.png');

  await browser.close();
  console.log('All sequential stage screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
