const puppeteer = require ('puppeteer');
const { pageExtend } = require('puppeteer-jquery');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

(async () => {
    const browser = await puppeteer.launch({
        slowMo: 300, // slow down by 250ms
        headless: !process.env.DEBUG
    });

    const page = await browser.newPage();
    const $page = pageExtend(page);

    await page.goto('https://frs.gov.cz/cs/ioff/application-status', {
        waitUntil: 'networkidle2',
    });

    if ( !process.env.CISLO_ZOV ) {
        await page.type('#edit-ioff-application-number', process.env.CISLO_JEDNACI, {delay: 30});
        await page.select('#edit-ioff-application-code', process.env.CISLO_JEDNACI_TYPE);
        await page.select('#edit-ioff-application-year', process.env.CISLO_JEDNACI_ROK);
    }

    await page.click('#edit-submit-button');

    let resultHtml = await $page.jQuery('.main-container .status ul li:first-of-type').html();
    let resultSpan = jQuery

    console.log(resultHtml);

    await browser.close();
})();