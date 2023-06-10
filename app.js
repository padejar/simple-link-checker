const express = require('express');
const bodyParser = require('body-parser');
const { default: puppeteer } = require('puppeteer');
const moment = require('moment/moment');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/screenshots', express.static(__dirname + '/screenshots'));
app.set('view engine', 'ejs');

app.get('/', (_, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/check-link', async (req, res) => {
    const { url } = req.body;

    if (!isValidURL(url)) {
        return res.send('Not a valid url!').status(402);
    }

    const screenshotPath = await urlChecker(url);
    return res.render(__dirname + '/result.ejs', { screenshotPath });
});

app.listen(port, () => {
    console.log(`Link checker is running on port ${port}`);
});

const urlChecker = async (url) => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url);
    
        // Set screen size
        await page.setViewport({width: 1280, height: 1024});
        await waitForNetworkIdle(page);

        let filename = url.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
        filename = `${moment().format('YYYYMMDDHHmmss')}-result-for-${filename}.png`;
        const path = `./screenshots/${filename}`;

        await page.screenshot({ path, fullPage: true });

        return `screenshots/${filename}`;
    } catch (e) {
        console.error(e);
    }
} 

const waitForNetworkIdle = async (page, timeout = 0, maxInflightRequest = 0) => {
    page.on('request', onRequestStarted);
    page.on('requestfinished', onRequestFinished);
    page.on('requestfailed', onRequestFinished);

    let inflight = 0;
    let fulfill;
    const promise = new Promise((x) => (fulfill = x));
    let timeoutId = setTimeout(onTimeoutDone, timeout);
    return promise;

    function onTimeoutDone() {
        page.removeListener('request', onRequestStarted);
        page.removeListener('requestfinished', onRequestFinished);
        page.removeListener('requestfailed', onRequestFinished);
        fulfill();
    }

    function onRequestStarted() {
        ++inflight;
        if (inflight > maxInflightRequests) clearTimeout(timeoutId);
    }

    function onRequestFinished() {
        if (inflight === 0) return;
        --inflight;
        if (inflight === maxInflightRequests) timeoutId = setTimeout(onTimeoutDone, timeout);
    }
}

function isValidURL(url) {
    const pattern = new RegExp(
      /^(https?:\/\/)?([a-z\d]+([a-z\d-]*[a-z\d])*\.)+[a-z]{2,}(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i
    );
    return pattern.test(url);
}