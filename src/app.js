const { default: puppeteer } = require('puppeteer');
const moment = require('moment/moment');
const { isValidURL, waitForNetworkIdle, uploadToS3 } = require('./utils');

const index = (_, res) => {
    return res.render(__dirname + '/templates/index.ejs');
};

const checkLink = async (req, res) => {
    const { url } = req.body;

    if (!isValidURL(url)) {
        return res.send('Not a valid url!').status(402);
    }

    const screenshotPath = await urlChecker(url);
    return res.render(__dirname + '/templates/result.ejs', { screenshotPath });
};

const urlChecker = async (url) => {
    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox'],
            headless: 'new',
        });
        const page = await browser.newPage();
        await page.goto(url);
    
        // Set screen size
        await page.setViewport({width: 1280, height: 1024});
        await waitForNetworkIdle(page);

        let filename = url.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
        filename = `${moment().format('YYYYMMDDHHmmss')}-result-for-${filename}.png`;

        const screenshot = await page.screenshot({ 
            type: "png",
            omitBackground: true,
         });

        const s3Upload = await uploadToS3(screenshot, filename);

        return s3Upload;
    } catch (e) {
        console.error(e);
    }
} 

module.exports = function(app) {
    app.get('/', index);
    app.post('/check-link', checkLink);
}