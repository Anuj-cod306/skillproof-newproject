import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function inspectMedia() {
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
  page.on('console', msg => console.log('LOG:', msg.text()));

  await page.goto('http://localhost:3000/#/student/ai-interview', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const info = await page.evaluate(async () => {
    const hasMedia = !!window.__skillproofMedia;
    let vTracks = 0, aTracks = 0, camText = '', micText = '', screenText = '';
    const camEl = document.getElementById('preflight-camera-status');
    const micEl = document.getElementById('preflight-mic-status');
    const screenEl = document.getElementById('preflight-recording-status');
    const stream = window.__skillproofMedia?.getStream();
    if (stream) {
      vTracks = stream.getVideoTracks().map(t => ({ readyState: t.readyState, enabled: t.enabled }));
      aTracks = stream.getAudioTracks().map(t => ({ readyState: t.readyState, enabled: t.enabled }));
    }
    return {
      hasMedia,
      camText: camEl?.innerText,
      micText: micEl?.innerText,
      screenText: screenEl?.innerText,
      vTracks,
      aTracks
    };
  });

  console.log('Media Info:', JSON.stringify(info, null, 2));

  // Now test setAllPermissions(true)
  const afterPerms = await page.evaluate(async () => {
    window.__skillproofMedia.setAllPermissions(true);
    await new Promise(r => setTimeout(r, 700));
    const camEl = document.getElementById('preflight-camera-status');
    const micEl = document.getElementById('preflight-mic-status');
    const screenEl = document.getElementById('preflight-recording-status');
    return {
      camText: camEl?.innerText,
      micText: micEl?.innerText,
      screenText: screenEl?.innerText
    };
  });

  console.log('After setAllPermissions(true):', JSON.stringify(afterPerms, null, 2));

  await browser.close();
}

inspectMedia().catch(console.error);
