const { Upload } = require("@aws-sdk/lib-storage");
const { S3Client, S3 } = require("@aws-sdk/client-s3");

const waitForNetworkIdle = async (page, timeout = 0, maxInflightRequests = 0) => {
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

async function uploadToS3 (imageBuffer, filename) {
    const client = new S3Client({
        credentials: {
            accessKeyId: 'AKIAZOBFQL4O5GV2K4VR',
            secretAccessKey: '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',
        },
        region: 'ap-southeast-1',
    });

    const upload = new Upload({
        client,
        params: {
            ACL: 'public-read',
            Bucket: 'link-checker-screenshots',
            Key: filename,
            Body: imageBuffer,
        }
    });

    const result = await upload.done();
    return result.Location;
}

module.exports = {
    waitForNetworkIdle,
    isValidURL,
    uploadToS3,
}