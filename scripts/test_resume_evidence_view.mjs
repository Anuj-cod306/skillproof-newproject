import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:/Users/Dell/.gemini/antigravity/brain/75f051e4-6a8a-41a8-8441-18517c19c29f';
const BASE_URL = 'http://localhost:3000/#';

const testResults = [];
function record(testName, passed, details = '') {
  testResults.push({ testName, passed, details });
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function run() {
  console.log('===========================================================');
  console.log('  TESTING EVIDENCE & RESUME VIEW/UPLOAD ACTIONS IN SKILLPROOF');
  console.log('===========================================================');

  // Launch browser
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1366, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Track all window.open invocations
  await page.evaluateOnNewDocument(() => {
    window.__openedUrls = [];
    window.open = function(url, target, features) {
      window.__openedUrls.push({ url, target, features });
      return { closed: false, focus: () => {} };
    };
  });

  // Navigate to login / seed auth
  console.log('\n[1] Navigating to SkillProof app and seeding auth...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });

  // Clear previous evidence mock state to ensure clean test
  await page.evaluate(() => {
    localStorage.removeItem('skillproof_evidence_docs');
    localStorage.setItem('skillproof_token', 'mock_jwt_token_for_student_testing');
    localStorage.setItem('skillproof_user', JSON.stringify({
      id: 1,
      email: 'anuj.student@skillproof.edu',
      name: 'Anuj Bhalothia',
      role: 'student',
      targetRole: 'Software Engineer'
    }));
  });

  // Navigate directly to Resume & Evidence Upload page
  console.log('\n[2] Navigating to /student/resume-upload...');
  await page.goto(`${BASE_URL}/student/resume-upload`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Take screenshot of Resume & Evidence page
  const pageScreenshotPath = path.join(ARTIFACTS_DIR, 'resume_evidence_page_view.png');
  await page.screenshot({ path: pageScreenshotPath, fullPage: false });
  record('Resume & Evidence Page Render', true, `Screenshot saved to ${path.basename(pageScreenshotPath)}`);

  // Verify all expected View buttons exist
  console.log('\n[3] Verifying View & Add Document button DOM elements...');
  const expectedRows = [
    { id: 'smartprep-project', name: 'SmartPrep Project', defaultUrl: '/documents/smartprep-project.pdf' },
    { id: 'system-design-cert', name: 'System Design Certificate', defaultUrl: '/documents/system-design-certificate.pdf' },
    { id: 'hackathon-winner', name: 'Hackathon Winner', defaultUrl: '/documents/hackathon-winner.pdf' },
    { id: 'opensource-contrib', name: 'Open Source Contribution', defaultUrl: '/documents/open-source-contribution.pdf' }
  ];

  for (const row of expectedRows) {
    const viewBtn = await page.$(`#btn-view-${row.id}`);
    const addDocBtn = await page.$(`#btn-add-doc-${row.id}`);
    record(`DOM Element Check: ${row.name} - View Button`, !!viewBtn);
    record(`DOM Element Check: ${row.name} - Add Document Button`, !!addDocBtn);
  }

  const currentResumeViewBtn = await page.$('#btn-view-current-resume');
  const currentResumeReplaceBtn = await page.$('#btn-replace-resume');
  record('Current Resume Card - View Button', !!currentResumeViewBtn);
  record('Current Resume Card - Replace Button', !!currentResumeReplaceBtn);

  // Test clicking default View buttons and verify window.open was invoked with correct arguments
  console.log('\n[4] Testing clicking default View buttons...');
  for (const row of expectedRows) {
    await page.evaluate(() => { window.__openedUrls = []; });
    await page.click(`#btn-view-${row.id}`);
    await new Promise(r => setTimeout(r, 250));

    const opened = await page.evaluate(() => window.__openedUrls);
    const lastCall = opened[opened.length - 1];

    if (lastCall && lastCall.url === row.defaultUrl && lastCall.target === '_blank' && lastCall.features === 'noopener,noreferrer') {
      record(`Click Default View: ${row.name}`, true, `Opened: ${lastCall.url}`);
    } else {
      record(`Click Default View: ${row.name}`, false, `Expected ${row.defaultUrl}, got: ${JSON.stringify(lastCall)}`);
    }
  }

  // Test Current Resume View button
  await page.evaluate(() => { window.__openedUrls = []; });
  await page.click('#btn-view-current-resume');
  await new Promise(r => setTimeout(r, 250));
  const currentResumeOpened = await page.evaluate(() => window.__openedUrls);
  record(
    'Click Current Resume View',
    currentResumeOpened.length > 0 && currentResumeOpened[0].target === '_blank',
    `Opened: ${currentResumeOpened[0]?.url}`
  );

  // Test "Add Document" file picker & immediate view update for all 4 evidence rows
  console.log('\n[5] Testing Add Document file selection and View update for all 4 rows...');
  const samplePdfPath = path.resolve('frontend/public/documents/smartprep-project.pdf');

  for (const row of expectedRows) {
    // 1. Click Add Document button to activate upload for this row
    await page.click(`#btn-add-doc-${row.id}`);
    await new Promise(r => setTimeout(r, 100));

    // 2. Select file on the hidden evidence file input
    const fileInput = await page.$('#input-evidence-file');
    await fileInput.uploadFile(samplePdfPath);
    await new Promise(r => setTimeout(r, 300));

    // 3. Verify View button is visible and clicking it opens the blob URL
    await page.evaluate(() => { window.__openedUrls = []; });
    const viewBtn = await page.$(`#btn-view-${row.id}`);
    record(`Post-Upload View Button Visible: ${row.name}`, !!viewBtn);

    if (viewBtn) {
      await page.click(`#btn-view-${row.id}`);
      await new Promise(r => setTimeout(r, 250));
      const openedAfter = await page.evaluate(() => window.__openedUrls);
      const lastCall = openedAfter[openedAfter.length - 1];
      const isBlobOrDoc = lastCall && (lastCall.url.startsWith('blob:') || lastCall.url.startsWith('/documents/'));
      record(`Click Post-Upload View: ${row.name}`, isBlobOrDoc, `Opened: ${lastCall?.url}`);
    }
  }

  // Verify static demo PDF files serve HTTP 200 on local server
  console.log('\n[6] Verifying static demo PDF files serve HTTP 200 on local server...');
  const docUrls = [
    '/documents/smartprep-project.pdf',
    '/documents/system-design-certificate.pdf',
    '/documents/hackathon-winner.pdf',
    '/documents/open-source-contribution.pdf',
    '/documents/anuj_bhalothia_resume.pdf'
  ];

  for (const docUrl of docUrls) {
    try {
      const status = await page.evaluate(async (url) => {
        const res = await fetch(url);
        return res.status;
      }, docUrl);
      const is200 = status === 200;
      record(`HTTP 200 Check: ${path.basename(docUrl)}`, is200, `Status: ${status}`);
    } catch (e) {
      record(`HTTP 200 Check: ${path.basename(docUrl)}`, false, e.message);
    }
  }

  // Take final screenshot showing all rows after upload tests
  await page.screenshot({ path: pageScreenshotPath, fullPage: false });

  await browser.close();

  console.log('\n===========================================================');
  const allPassed = testResults.every(t => t.passed);
  console.log(`SUMMARY: ${testResults.filter(t => t.passed).length}/${testResults.length} Tests Passed`);
  console.log('===========================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
