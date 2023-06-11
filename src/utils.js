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

module.exports = {
    waitForNetworkIdle,
    isValidURL,
}