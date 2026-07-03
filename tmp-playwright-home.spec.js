const { test } = require('@playwright/test');

test('inspect live home page', async ({ page }) => {
  page.on('console', msg => console.log(`console:${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.log(`pageerror: ${err.message}`));
  page.on('requestfailed', req => console.log(`requestfailed: ${req.url()} ${req.failure()?.errorText || ''}`));

  const response = await page.goto('https://miss-jolie.store/home.html', {
    waitUntil: 'networkidle',
  });

  console.log(`status: ${response.status()}`);
  console.log(`title: ${await page.title()}`);
  console.log(`cards: ${await page.locator('.product-card').count()}`);
  console.log(`modeText: ${await page.locator('.logo').textContent()}`);
});
