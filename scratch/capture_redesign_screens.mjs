import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\75f051e4-6a8a-41a8-8441-18517c19c29f';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Home
  await page.goto('http://localhost:3000/#/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(artifactDir, '01_redesign_home.png'), fullPage: false });
  console.log('Captured 01_redesign_home.png');

  // 2. Student Dashboard
  await page.evaluate(() => {
    const student = {
      email: 'leooo@gmail.com',
      role: 'student',
      name: 'leo',
      college: 'JNU jaipur college',
      degree: 'B.Tech Computer Science'
    };
    localStorage.setItem('skillproof_user', JSON.stringify(student));
    localStorage.setItem('skillproof_role', 'student');
    localStorage.setItem('skillproof_token', 'demo_token');
  });
  await page.goto('http://localhost:3000/#/student/dashboard', { waitUntil: 'networkidle2' });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(artifactDir, '02_redesign_student_dashboard.png'), fullPage: false });
  console.log('Captured 02_redesign_student_dashboard.png');

  // 3. Industry Dashboard & Candidate Search
  await page.evaluate(() => {
    const industry = {
      email: 'priya.mehta@novatech.io',
      role: 'industry',
      name: 'Priya Mehta',
      company: 'NovaTech Solutions'
    };
    localStorage.setItem('skillproof_user', JSON.stringify(industry));
    localStorage.setItem('skillproof_role', 'industry');
    localStorage.setItem('skillproof_token', 'demo_token');
  });
  await page.goto('http://localhost:3000/#/industry/dashboard', { waitUntil: 'networkidle2' });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(artifactDir, '03_redesign_industry_dashboard.png'), fullPage: false });
  console.log('Captured 03_redesign_industry_dashboard.png');

  await page.goto('http://localhost:3000/#/industry/candidates', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactDir, '06_redesign_candidate_search.png'), fullPage: false });
  console.log('Captured 06_redesign_candidate_search.png');

  // 4. Academia Dashboard
  await page.evaluate(() => {
    const academician = {
      email: 'sverma@iitdelhi.ac.in',
      role: 'academician',
      name: 'Dr. S. K. Verma',
      institution: 'ABES Engineering College'
    };
    localStorage.setItem('skillproof_user', JSON.stringify(academician));
    localStorage.setItem('skillproof_role', 'academician');
    localStorage.setItem('skillproof_token', 'demo_token');
  });
  await page.goto('http://localhost:3000/#/academician/dashboard', { waitUntil: 'networkidle2' });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(artifactDir, '04_redesign_academia_dashboard.png'), fullPage: false });
  console.log('Captured 04_redesign_academia_dashboard.png');

  // 5. Institution Dashboard
  await page.evaluate(() => {
    const institution = {
      email: 'dean@abes.ac.in',
      role: 'institution',
      name: 'Prof. Rajesh K. Bansal',
      institutionName: 'ABES Engineering College'
    };
    localStorage.setItem('skillproof_user', JSON.stringify(institution));
    localStorage.setItem('skillproof_role', 'institution');
    localStorage.setItem('skillproof_token', 'demo_token');
  });
  await page.goto('http://localhost:3000/#/institution/dashboard', { waitUntil: 'networkidle2' });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(artifactDir, '05_redesign_institution_dashboard.png'), fullPage: false });
  console.log('Captured 05_redesign_institution_dashboard.png');

  await browser.close();
  console.log('ALL REDESIGN SCREENSHOTS CAPTURED SUCCESSFULLY');
})();
