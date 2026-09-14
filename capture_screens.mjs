import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\75f051e4-6a8a-41a8-8441-18517c19c29f';
const BASE_URL = 'http://localhost:3000/#';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  let token = 'mock-token';
  const email = `demo_candidate_${Date.now()}@skillproof.edu`;
  try {
    const regRes = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Johnson',
        email: email,
        password: 'Password123!',
        role: 'STUDENT',
        college: 'Delhi Technological University'
      })
    });
    if (regRes.ok) {
      const regData = await regRes.json();
      token = regData.token || token;
    }
  } catch (e) {
    console.log('Backend auth fallback');
  }

  // Ensure student session is active with valid tokens
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await page.evaluate((tok, em) => {
    try {
      const user = {
        id: 1001,
        userId: 1001,
        profileId: 1001,
        email: em,
        name: 'Alex Johnson',
        username: 'alex_johnson',
        role: 'student',
        college: 'Delhi Technological University',
        degree: 'B.Tech Computer Science',
        targetRole: 'Full Stack Engineer',
        token: tok
      };
      localStorage.setItem('skillproof_token', tok);
      localStorage.setItem('skillproof_user', JSON.stringify(user));
      localStorage.setItem('skillproof_student_token', tok);
      localStorage.setItem('skillproof_student_user', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', tok);
      localStorage.setItem('activeRole', 'student');
    } catch (e) {}
  }, token, email);

  const routes = [
    { url: `${BASE_URL}/student/dashboard`, name: 'screen1_student_dashboard.png' },
    { url: `${BASE_URL}/student/profile`, name: 'screen2_student_profile.png' },
    { url: `${BASE_URL}/student/resume-upload`, name: 'screen3_resume_upload.png' },
    { url: `${BASE_URL}/student/skill-map`, name: 'screen4_skill_map.png' },
    { url: `${BASE_URL}/student/assessments`, name: 'screen5_skill_assessments.png' },
    { url: `${BASE_URL}/student/github-verify`, name: 'screen6_github_verification.png' },
    { url: `${BASE_URL}/student/ai-interview`, name: 'screen7_ai_interview.png' },
    { url: `${BASE_URL}/student/passport`, name: 'screen8_skill_passport.png' },
    { url: `${BASE_URL}/student/jobs`, name: 'screen9_job_opportunities.png' },
    { url: `${BASE_URL}/industry/dashboard`, name: 'portal_industry_dashboard.png' },
    { url: `${BASE_URL}/academician/dashboard`, name: 'portal_academia_dashboard.png' },
    { url: `${BASE_URL}/institution/dashboard`, name: 'portal_institution_dashboard.png' },
    { url: `${BASE_URL}/`, name: 'public_homepage.png' }
  ];

  for (const r of routes) {
    try {
      console.log(`Navigating to ${r.url}...`);
      await page.goto(r.url, { waitUntil: 'networkidle0', timeout: 15000 });
      await new Promise(res => setTimeout(res, 1200));

      if (r.url.includes('/student/passport')) {
        try {
          const buttons = await page.$$('button');
          for (const b of buttons) {
            const text = await page.evaluate(el => el.innerText, b);
            if (text && text.includes('Generate')) {
              await b.click();
              await new Promise(res => setTimeout(res, 2000));
              break;
            }
          }
        } catch (e) {}
      }

      await page.screenshot({ path: path.join(ARTIFACTS_DIR, r.name), fullPage: false });
      console.log(`Captured ${r.name}`);
    } catch (e) {
      console.error(`Failed to capture ${r.name}:`, e.message);
    }
  }

  await browser.close();
}

capture();
