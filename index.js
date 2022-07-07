const puppeteer = require('puppeteer');
const {pageExtend} = require('puppeteer-jquery');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

// Load env vars
dotenv.config();

const isDebug = (process.env.DEBUG === true);

function send_mail(emailPlain, emailHtml) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: process.env.SEND_SUCCESS_TO,
        subject: emailPlain,
        text: emailPlain,
        html: emailHtml
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            if (isDebug) {
                console.log('Email sent: ' + info.response);
            }
        }
    });
}

(async () => {

    const browser = await puppeteer.launch({
        slowMo: 300, // slow down by 250ms
        headless: isDebug
    });

    const page = await browser.newPage();

    await page.goto('https://frs.gov.cz/cs/ioff/application-status', {
        waitUntil: 'networkidle2',
    });

    if (!process.env.CISLO_ZOV) {
        await page.type('#edit-ioff-application-number', process.env.CISLO_JEDNACI, {delay: 30});
        await page.select('#edit-ioff-application-code', process.env.CISLO_JEDNACI_TYPE);
        await page.select('#edit-ioff-application-year', process.env.CISLO_JEDNACI_ROK);
    } else {
        await page.type('#edit-ioff-zov', process.env.CISLO_ZOV, {delay: 30});
    }

    await page.click('#edit-submit-button');

    const $page = pageExtend(page);
    let result = await $page.jQuery('.main-container .status ul li:first-of-type span strong').html();
    let resultHtml = await $page.jQuery('.main-container .status ul').html();

    const applicationNumber = (!process.env.CISLO_ZOV) ? `OAM-${process.env.CISLO_JEDNACI}/${process.env.CISLO_JEDNACI_TYPE}-${process.env.CISLO_JEDNACI_ROK}` : process.env.CISLO_ZOV;
    result = `${result} = ${applicationNumber}`;
    console.log(result);

    await browser.close();
    if (process.env.ENABLE_MAIL) send_mail(result, resultHtml); // If callback  mail enabled
})();