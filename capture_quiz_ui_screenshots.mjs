import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\75f051e4-6a8a-41a8-8441-18517c19c29f';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1.5 });

  // 1. Home Page
  console.log('Capturing Home Page...');
  await page.goto('http://localhost:3000/#/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_quiz_homepage.png'), fullPage: false });

  // 2. Login Page
  console.log('Capturing Login Page...');
  await page.goto('http://localhost:3000/#/login', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_quiz_login.png'), fullPage: false });

  // Authenticate as Student
  await page.evaluate(() => {
    localStorage.setItem('skillproof_token', 'eyJhbGciOiJIUzM4NCJ9.mockToken');
    localStorage.setItem('skillproof_user', JSON.stringify({
      id: 'student_quiz_1',
      name: 'Alex Morgan',
      email: 'alex.morgan@stanford.edu',
      role: 'STUDENT',
      degree: 'B.S. Computer Science',
      college: 'School of Engineering'
    }));
  });

  // 3. Student Dashboard
  console.log('Capturing Student Dashboard...');
  await page.goto('http://localhost:3000/#/student/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_quiz_student_dashboard.png'), fullPage: false });

  // Authenticate as Industry
  await page.evaluate(() => {
    localStorage.setItem('skillproof_user', JSON.stringify({
      id: 'industry_quiz_1',
      name: 'Sarah Chen',
      email: 'sarah.chen@novatech.com',
      role: 'INDUSTRY',
      company: 'NovaTech Solutions'
    }));
  });

  // 4. Industry Dashboard
  console.log('Capturing Industry Dashboard...');
  await page.goto('http://localhost:3000/#/industry/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_quiz_industry_dashboard.png'), fullPage: false });

  // Authenticate as Academician
  await page.evaluate(() => {
    localStorage.setItem('skillproof_user', JSON.stringify({
      id: 'acad_quiz_1',
      name: 'Dr. S. K. Verma',
      email: 'sk.verma@abes.edu',
      role: 'ACADEMICIAN',
      college: 'ABES Engineering College'
    }));
  });

  // 5. Academia Dashboard
  console.log('Capturing Academia Dashboard...');
  await page.goto('http://localhost:3000/#/academician/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_quiz_academia_dashboard.png'), fullPage: false });

  // Authenticate as Institution
  await page.evaluate(() => {
    localStorage.setItem('skillproof_user', JSON.stringify({
      id: 'inst_quiz_1',
      name: 'Director ABES',
      email: 'director@abes.edu',
      role: 'INSTITUTION',
      college: 'ABES Engineering College'
    }));
  });

  // 6. Institution Dashboard
  console.log('Capturing Institution Dashboard...');
  await page.goto('http://localhost:3000/#/institution/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_quiz_institution_dashboard.png'), fullPage: false });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

main().catch(err => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
