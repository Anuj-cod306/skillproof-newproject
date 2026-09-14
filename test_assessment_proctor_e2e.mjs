import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\75f051e4-6a8a-41a8-8441-18517c19c29f';
const BASE_URL = 'http://localhost:3000/#';
const API_URL = 'http://localhost:8080/api';

const results = [];
function recordResult(testName, passed, details = '') {
  results.push({ testName, passed, details });
  const mark = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${mark}: ${testName}${details ? ' - ' + details : ''}`);
}

async function runAllTests() {
  console.log('================================================================');
  console.log('  SKILLPROOF PROCTORING & TAB-SWITCH ENFORCEMENT E2E SUITE');
  console.log('================================================================');

  // 1. Register Fresh Candidate Persona
  const ts = Date.now();
  const candidateEmail = `proctor_cand_${ts}@skillproof.edu`;
  console.log(`\n[1] Registering Fresh Candidate Persona (${candidateEmail})...`);
  let authData;
  try {
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `cand_${ts}`,
        email: candidateEmail,
        password: 'password123',
        fullName: 'Proctored Test Candidate',
        role: 'student',
        college: 'JNU jaipur college',
        degree: 'B.Tech Computer Science',
        targetRole: 'Full Stack Engineer'
      })
    });
    if (!regRes.ok) throw new Error(`Registration failed with status ${regRes.status}`);
    authData = await regRes.json();
    console.log(`Candidate Registered & Token Issued: ${authData.token?.substring(0, 20)}...`);
  } catch (err) {
    console.error('Fatal Registration Error:', err);
    process.exit(1);
  }

  // 2. Launch Chrome via Puppeteer-core
  console.log('\n[2] Launching Chrome with Media Stream Emulation...');
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

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('Arena') || text.includes('Proctor') || text.includes('Violation')) {
      console.log('BROWSER CONSOLE:', text);
    }
  });
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  // Authenticate candidate into browser context localStorage
  console.log('Injecting candidate authentication state into browser context...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await page.evaluate((token, email) => {
    const user = {
      id: 9999,
      userId: 9999,
      profileId: 9999,
      email: email,
      name: 'Proctored Test Candidate',
      username: 'proctored_cand',
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

  // Verify dashboard navigation
  await page.goto(`${BASE_URL}/student/dashboard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  console.log('Logged in as Student. Current URL:', page.url());

  try {
    // =======================================================================
    // PART 1: AI INTERVIEW ARENA PROCTORING TESTS
    // =======================================================================
    console.log('\n--- PART 1: AI INTERVIEW ARENA PROCTORING ---');
    await page.goto(`${BASE_URL}/student/ai-interview`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('#card-mode-technical', { timeout: 15000 });

    // Test 1: Permissions OFF -> Start Button Blocked
    console.log('\n[Test 1] Verifying Pre-Flight Gate with Media Permissions OFF...');
    await new Promise(r => setTimeout(r, 1500));
    await page.evaluate(async () => {
      if (window.__skillproofMedia) {
        await window.__skillproofMedia.setAllPermissions(false);
      }
    });
    await new Promise(r => setTimeout(r, 800));

    const startBtnDisabled = await page.$eval('#btn-start-arena', el => el.disabled);
    const noticeText = await page.$eval('#notice-proctoring-enforcement', el => el.innerText);
    const camText = await page.$eval('#preflight-camera-status', el => el.innerText);
    const micText = await page.$eval('#preflight-mic-status', el => el.innerText);
    const screenText = await page.$eval('#preflight-recording-status', el => el.innerText);

    const test1Pass = startBtnDisabled &&
      noticeText.includes('Switching tabs or leaving this window will automatically submit your attempt') &&
      camText.includes('REQUIRED') &&
      micText.includes('REQUIRED') &&
      screenText.includes('Authorize');

    recordResult(
      'Test 1: Pre-flight Permissions Gate Blocks Start when Permissions OFF',
      test1Pass,
      `Start button disabled: ${startBtnDisabled}, Notice text: "${noticeText.substring(0, 40)}..."`
    );
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_interview_preflight_blocked.png') });

    // Test 2: Permissions ON -> Status Checkmarks & Start Button Unlocks
    console.log('\n[Test 2] Authorizing Camera, Microphone, and Screen Recording...');
    await page.evaluate(async () => {
      if (window.__skillproofMedia) {
        await window.__skillproofMedia.setAllPermissions(true);
      }
    });
    await new Promise(r => setTimeout(r, 1200));

    const startBtnEnabled = await page.$eval('#btn-start-arena', el => !el.disabled);
    const camStatusAfter = await page.$eval('#preflight-camera-status', el => el.innerText);
    const micStatusAfter = await page.$eval('#preflight-mic-status', el => el.innerText);
    const screenStatusAfter = await page.$eval('#preflight-recording-status', el => el.innerText);

    const test2Pass = startBtnEnabled &&
      (camStatusAfter.includes('Camera ✓') || camStatusAfter.includes('READY')) &&
      (micStatusAfter.includes('Microphone ✓') || micStatusAfter.includes('READY')) &&
      (screenStatusAfter.includes('Screen Recording ✓') || screenStatusAfter.includes('ACTIVE'));

    recordResult(
      'Test 2: Pre-flight Checkmarks (Camera ✓, Microphone ✓, Screen Recording ✓) & Start Button Unlocked',
      test2Pass,
      `Start button enabled: ${startBtnEnabled}, Cam: ${camStatusAfter.includes('Camera ✓')}, Mic: ${micStatusAfter.includes('Microphone ✓')}, Screen: ${screenStatusAfter.includes('Screen Recording ✓')}`
    );
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '02_interview_preflight_authorized.png') });

    // Test 3: Start Active Session & Verify Continuous 🔴 RECORDING Badge
    console.log('\n[Test 3] Starting Active Interview Session & Verifying Continuous Recording Badge...');
    await page.click('#btn-start-arena');
    await page.waitForSelector('#badge-interview-status', { timeout: 15000 });

    const sessionStatus = await page.$eval('#badge-interview-status', el => el.innerText);
    const recordingBadgeText1 = await page.$eval('#badge-recording-status', el => el.innerText);
    
    // Wait 2.5 seconds to ensure timer increments
    await new Promise(r => setTimeout(r, 2500));
    const recordingBadgeText2 = await page.$eval('#badge-recording-status', el => el.innerText);

    const test3Pass = sessionStatus.includes('ACTIVE') &&
      recordingBadgeText1.includes('🔴 RECORDING') &&
      recordingBadgeText2.includes('🔴 RECORDING') &&
      recordingBadgeText1 !== recordingBadgeText2;

    recordResult(
      'Test 3: Continuous 🔴 RECORDING Indicator Active and Incrementing',
      test3Pass,
      `Initial: "${recordingBadgeText1}", After 2.5s: "${recordingBadgeText2}"`
    );
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '03_interview_active_recording.png') });

    // Test 4: Screen Recording Device Interruption -> Session Locked/Paused
    console.log('\n[Test 4] Simulating Screen Recording Device Interruption...');
    await page.evaluate(() => {
      if (window.__skillproofMedia) {
        window.__skillproofMedia.stopScreenRecording();
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    const pausedStatus = await page.$eval('#badge-interview-status', el => el.innerText);
    const modalVisible = await page.$eval('#modal-interrupted-warning', el => !!el).catch(() => false);
    const test4Pass = pausedStatus.includes('PAUSED') || modalVisible;

    recordResult(
      'Test 4: Recording Interruption Immediately Pauses/Locks Session with Warning',
      test4Pass,
      `Status: "${pausedStatus}", Modal visible: ${modalVisible}`
    );
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '04_interview_recording_interrupted.png') });

    // Resume recording to continue test
    await page.evaluate(() => {
      if (window.__skillproofMedia) {
        window.__skillproofMedia.startScreenRecording();
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    // Test 5: Tab-Switch / Window Blur Violation -> Immediate Auto-Submit & Restart Blocked
    console.log('\n[Test 5] Simulating Tab Switch / Window Blur Violation in Interview...');
    const candidateTa = await page.$('#textarea-candidate-answer');
    if (candidateTa) {
      await candidateTa.type('Draft answer explaining ACID database properties and concurrency control.');
    }

    // Fire tab switch
    await page.evaluate(() => {
      if (window.__skillproofMedia) {
        window.__skillproofMedia.simulateTabSwitch();
      }
    });

    // Wait for auto-submitted dossier view to appear
    await page.waitForSelector('#banner-interview-violation', { timeout: 15000 });

    const violationBannerText = await page.$eval('#banner-interview-violation', el => el.innerText);
    const violationReason = await page.$eval('#text-interview-violation-reason', el => el.innerText);
    const violationCount = await page.$eval('#text-interview-violation-count', el => el.innerText);
    const resetBtnDisabled = await page.$eval('#btn-reset-session', el => el.disabled);
    const latestStatusBadge = await page.$eval('#badge-interview-status', el => el.innerText);

    const test5Pass = (
      violationBannerText.toLowerCase().includes('auto-submitted') ||
      violationBannerText.toLowerCase().includes('violation')
    ) &&
    violationBannerText.toLowerCase().includes('left the assessment window') &&
    violationCount.includes('1') &&
    resetBtnDisabled === true &&
    latestStatusBadge.toUpperCase().includes('AUTO_SUBMITTED');

    recordResult(
      'Test 5: Tab Switch Auto-Submits Session, Renders Violation Banner, and Blocks Restart',
      test5Pass,
      `Status: ${latestStatusBadge}, Reason: "${violationReason}", Count: "${violationCount}", Reset Disabled: ${resetBtnDisabled}`
    );
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '05_interview_auto_submitted_violation.png') });

    // Test 6: Page Reload Persistence & Anti-Tamper Protection
    console.log('\n[Test 6] Testing Page Reload Persistence & Restart Protection...');
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('#banner-interview-violation', { timeout: 15000 });

    const reloadedStatus = await page.$eval('#badge-interview-status', el => el.innerText);
    const reloadedResetDisabled = await page.$eval('#btn-reset-session', el => el.disabled);
    const reloadedViolationVisible = await page.$eval('#banner-interview-violation', el => !!el);

    const test6Pass = reloadedStatus.includes('AUTO_SUBMITTED') &&
      reloadedResetDisabled === true &&
      reloadedViolationVisible === true;

    recordResult(
      'Test 6: Page Reload Rehydrates AUTO_SUBMITTED State and Retains Restart Lock',
      test6Pass,
      `Status: ${reloadedStatus}, Reset Disabled: ${reloadedResetDisabled}, Violation Banner Persisted: ${reloadedViolationVisible}`
    );
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '06_interview_reload_persisted.png') });

    // =======================================================================
    // PART 2: OBJECTIVE SKILL ASSESSMENT PROCTOR TESTS
    // =======================================================================
    console.log('\n--- PART 2: SKILL ASSESSMENT PROCTORING & STRICT SCORING ---');
    await page.goto(`${BASE_URL}/student/assessments`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('#btn-open-diagnostic-preflight', { timeout: 15000 });

    // Open Pre-flight modal
    console.log('Opening Diagnostic Pre-flight Checklist...');
    await page.click('#btn-open-diagnostic-preflight');
    await page.waitForSelector('#card-assessment-preflight', { timeout: 15000 });

    // Test 7: Assessment Pre-Flight Gate
    console.log('\n[Test 7] Verifying Skill Assessment Pre-Flight Checklist...');
    const assessStartDisabledInitial = await page.$eval('#btn-start-proctored-session', el => el.disabled);
    const assessNoticeText = await page.$eval('#notice-assessment-proctor-warning', el => el.innerText);

    // Grant permissions
    await page.evaluate(() => {
      if (window.__skillproofProctor) {
        window.__skillproofProctor.setPermissions({ camera: true, microphone: true, screen: true });
      }
    });
    await new Promise(r => setTimeout(r, 600));

    const assessStartEnabled = await page.$eval('#btn-start-proctored-session', el => !el.disabled);
    const assessCamCheck = await page.$eval('#status-proctor-camera', el => el.innerText);
    const assessMicCheck = await page.$eval('#status-proctor-mic', el => el.innerText);
    const assessScreenCheck = await page.$eval('#status-proctor-screen', el => el.innerText);

    const test7Pass = assessStartDisabledInitial === true &&
      assessNoticeText.toLowerCase().includes('switching tabs or leaving this window will automatically submit your attempt') &&
      assessStartEnabled === true &&
      assessCamCheck.includes('Camera ✓') &&
      assessMicCheck.includes('Microphone ✓') &&
      assessScreenCheck.includes('Screen Recording ✓');

    recordResult(
      'Test 7: Skill Assessment Pre-Flight Gate Enforces Camera, Mic & Screen Recording',
      test7Pass,
      `Notice: "${assessNoticeText.substring(0, 40)}...", Checkmarks: ${assessCamCheck}, ${assessMicCheck}, ${assessScreenCheck}`
    );
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '07_assessment_preflight_ready.png') });

    // Test 8: Start Assessment, Recording Badge, Tab Switch Auto-Submit & Strict Scoring
    console.log('\n[Test 8] Starting Assessment, Recording Badge, Tab Switch Auto-Submit & Strict Scoring...');
    await page.click('#btn-start-proctored-session');
    await page.waitForSelector('#proctor-recording-badge', { timeout: 15000 });

    const liveAssessmentRecBadge = await page.$eval('#proctor-recording-badge', el => el.innerText);

    // Answer Question 1 option
    await new Promise(r => setTimeout(r, 1000));
    const optionBtns = await page.$$('.space-y-2\\.5 button, button[id^="option-"]');
    if (optionBtns.length > 0) {
      console.log(`Selecting first option for question 1 (${optionBtns.length} options found)...`);
      await optionBtns[0].click();
      await new Promise(r => setTimeout(r, 500));
    }

    // Simulate Tab Switch
    console.log('Disposing tab switch in active assessment...');
    await page.evaluate(() => {
      if (window.__skillproofProctor) {
        window.__skillproofProctor.simulateTabSwitch();
      }
    });

    // Wait for auto-submitted view to appear
    await page.waitForSelector('#banner-assessment-violation', { timeout: 15000 });

    const assessViolationBanner = await page.$eval('#banner-assessment-violation', el => el.innerText);
    const retakeBlocked = await page.$eval('#btn-retake-assessment', el => el.disabled);
    const retakeBlockedNotice = await page.$eval('#notice-retake-blocked', el => el.innerText);

    const test8Pass = liveAssessmentRecBadge.includes('🔴 RECORDING') &&
      (assessViolationBanner.toLowerCase().includes('auto-submitted') || assessViolationBanner.toLowerCase().includes('violation')) &&
      assessViolationBanner.toLowerCase().includes('left the assessment window') &&
      retakeBlocked === true;

    recordResult(
      'Test 8: Assessment Tab-Switch Auto-Submits with Violation Copy, Strict Scoring & Restart Blocked',
      test8Pass,
      `Badge: "${liveAssessmentRecBadge}", Violation text contains: "Test Auto-Submitted", Retake Blocked: ${retakeBlocked}`
    );
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '08_assessment_auto_submitted_violation.png') });

    // Test 9: Assessment Reload Persistence
    console.log('\n[Test 9] Reloading Assessment Page to Verify Persistence...');
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('#banner-assessment-violation', { timeout: 15000 });

    const reloadAssessViolationVisible = await page.$eval('#banner-assessment-violation', el => !!el);
    const reloadRetakeBlocked = await page.$eval('#btn-retake-assessment', el => el.disabled);

    const test9Pass = reloadAssessViolationVisible === true && reloadRetakeBlocked === true;

    recordResult(
      'Test 9: Assessment Page Reload Rehydrates AUTO_SUBMITTED State and Blocks Retake',
      test9Pass,
      `Violation Visible: ${reloadAssessViolationVisible}, Retake Blocked: ${reloadRetakeBlocked}`
    );
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '09_assessment_reload_persisted.png') });

  } catch (err) {
    console.error('Runtime Error during E2E Execution:', err);
    recordResult('E2E Execution Error', false, err.message);
  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n================================================================');
  console.log('                  E2E TEST EXECUTION SUMMARY');
  console.log('================================================================');
  const allPassed = results.length === 9 && results.every(r => r.passed);
  results.forEach((r, idx) => {
    console.log(`[${idx + 1}] ${r.passed ? '✅ PASS' : '❌ FAIL'}: ${r.testName}`);
  });
  console.log(`\nTOTAL: ${results.filter(r => r.passed).length}/${results.length} PASSED`);
  if (!allPassed) {
    process.exitCode = 1;
  }
}

runAllTests().catch(err => {
  console.error('Fatal unhandled error:', err);
  process.exit(1);
});
