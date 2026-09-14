import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3000/#/', { waitUntil: 'networkidle2' });
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

  await page.goto('http://localhost:3000/#/industry/candidates', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const content = await page.evaluate(() => document.body.innerText);
  console.log('BODY TEXT LENGTH:', content.length);
  console.log('SNIPPET:', content.slice(0, 300));

  await browser.close();
})();
