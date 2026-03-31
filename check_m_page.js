const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        page.on('pageerror', e => errors.push(e.message));
        await page.goto('http://localhost:3000/m', { waitUntil: 'networkidle2', timeout: 30000 });
        const content = await page.content();
        console.log('content length', content.length);
        console.log('errors', JSON.stringify(errors, null, 2));
        await browser.close();
    } catch (err) {
        console.error('fatal', err);
        process.exit(1);
    }
})();
