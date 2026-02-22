const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 2000));

        // Log in to bypass LockScreen
        console.log("Mocking login...");
        await page.evaluate(() => {
            // By clicking login button we can trigger login, if it's there
            const emailInput = document.querySelector('input[type="email"]');
            const passInput = document.querySelector('input[type="password"]');
            if (emailInput && passInput) {
                emailInput.value = 'test@test.com';
                passInput.value = 'password';
                const submit = document.querySelector('button[type="submit"]');
                if (submit) submit.click();
            }
        });
        await new Promise(r => setTimeout(r, 2000));

        // Click About me
        await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('nav ul li p'));
            const about = items.find(el => el.innerText.includes('About me'));
            if (about) about.click();
        });
        await new Promise(r => setTimeout(r, 1000));

        // Click Resume
        await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('nav ul li p'));
            const res = items.find(el => el.innerText.includes('Resume'));
            if (res) res.click();
        });
        await new Promise(r => setTimeout(r, 1000));

        // Click Ask
        await page.evaluate(() => {
            const dockBtns = document.querySelectorAll('.dock-icon img');
            for (let img of dockBtns) {
                if (img.alt && img.alt.includes('Ask')) {
                    img.parentElement.click();
                }
            }
        });
        await new Promise(r => setTimeout(r, 2000));

        const statsAfter = await page.evaluate(() => {
            const getStats = (id) => {
                const el = document.getElementById(id);
                if (!el) return 'NOT FOUND';
                const comp = window.getComputedStyle(el);
                return {
                    display: comp.display,
                    opacity: comp.opacity,
                    width: el.offsetWidth,
                    height: el.offsetHeight,
                    zIndex: comp.zIndex,
                    left: comp.left,
                    top: comp.top,
                    transform: comp.transform
                };
            };
            return {
                about: getStats('about'),
                resume: getStats('resume'),
                ask: getStats('Ask'),
                finder: getStats('finder')
            };
        });
        console.log("Stats after opening:", statsAfter);

    } catch (e) { console.error(e) } finally {
        await browser.close();
    }
})();
