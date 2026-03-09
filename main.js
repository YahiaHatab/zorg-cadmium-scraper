const { Actor } = require('apify');
const scrapeCustomEvent = require('./scraper.js');

Actor.main(async () => {
    // 1. Get the inputs from the Apify UI
    const input = await Actor.getInput();
    const { customInput, token } = input;

    // 2. Define the log and state helpers to match your ZORG signature
    const emitLog = (message) => console.log(`[ZORG-LOG]: ${message}`);

    // Apify handles cancellation differently, but we can pass a dummy state
    const runState = {
        aborted: false,
        updateProgress: (current, total) => {
            console.log(`Progress: ${current}/${total}`);
        }
    };

    // 3. Run your existing engine
    const results = await scrapeCustomEvent({ customInput, token }, emitLog, runState);

    // 4. Save results to Apify's cloud dataset
    await Actor.pushData(results);

    console.log('Done! Data saved to Apify Dataset.');
});