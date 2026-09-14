import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testToggle() {
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
  await page.goto('http://localhost:3000/#/student/ai-interview', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  console.log('--- Turning OFF permissions ---');
  await page.evaluate(() => {
    window.__skillproofMedia.setAllPermissions(false);
  });
  await new Promise(r => setTimeout(r, 1000));

  const offState = await page.evaluate(() => ({
    camText: document.getElementById('preflight-camera-status')?.innerText,
    micText: document.getElementById('preflight-mic-status')?.innerText,
    screenText: document.getElementById('preflight-recording-status')?.innerText,
    startDisabled: document.getElementById('btn-start-arena')?.disabled
  }));
  console.log('OFF State:', offState);

  console.log('--- Turning ON permissions ---');
  await page.evaluate(() => {
    window.__skillproofMedia.setAllPermissions(true);
  });
  await new Promise(r => setTimeout(r, 1000));

  const onState = await page.evaluate(() => ({
    camText: document.getElementById('preflight-camera-status')?.innerText,
    micText: document.getElementById('preflight-mic-status')?.innerText,
    screenText: document.getElementById('preflight-recording-status')?.innerText,
    startDisabled: document.getElementById('btn-start-arena')?.disabled
  }));
  console.log('ON State:', onState);

  await browser.close();
}

testToggle().catch(console.error);
