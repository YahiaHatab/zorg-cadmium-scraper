/**
 * Custom ZORG-Ω Scraper Engine: Conference Harvester (V5 - High Speed Concurrency)
 * @param {Object} params - The payload containing inputs (customInput = POST payload, token = Cookie).
 * @param {Function} emitLog - Function to log real-time telemetry strings.
 * @param {Object} runState - State object to monitor cancellation (runState.aborted).
 * @returns {Array} An array of raw exhibitor objects.
 */
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function scrapeCustomEvent(params, emitLog, runState) {
    emitLog("Initializing Conference Harvester Engine (V5 - High Speed Concurrency)...");

    const payloadString = params.customInput;
    if (!payloadString) throw new Error("Missing required POST payload in customInput.");

    const cookieString = params.token || "";
    if (!cookieString) emitLog("WARNING: No cookies provided. The server might reject the request.");

    emitLog("Extracting EventKey from payload...");
    const urlParams = new URLSearchParams(payloadString);
    const eventKey = urlParams.get('EventKey');

    if (!eventKey) throw new Error("Could not find EventKey in the provided payload string.");

    emitLog(`Starting extraction for EventKey: ${eventKey}...`);

    const rawRecords = [];

    try {
        emitLog("Fetching booth layout and IDs...");
        const boothsUrl = "https://www.conferenceharvester.com/floorplan/v2/ajaxcalls/CreateBoothDivs.asp";

        const boothsResponse = await axios.post(boothsUrl, payloadString, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Cookie': cookieString,
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const boothsData = boothsResponse.data.boothDivs;
        if (!boothsData || !Array.isArray(boothsData)) {
            throw new Error("Unexpected response format. Expected 'boothDivs' array.");
        }

        const assignedBooths = boothsData.filter(b => b.boothID && (b.boothStatus === "Unavailable" || b.boothStatus === "Rented"));
        const totalBooths = assignedBooths.length;

        emitLog(`Successfully parsed response. Found ${totalBooths} booths to process.`);

        const CONCURRENCY_LIMIT = 5;

        for (let i = 0; i < totalBooths; i += CONCURRENCY_LIMIT) {
            if (runState && runState.aborted) {
                emitLog("Extraction aborted by user gracefully. Exiting loop.");
                break;
            }

            const chunk = assignedBooths.slice(i, i + CONCURRENCY_LIMIT);
            const currentMax = Math.min(i + CONCURRENCY_LIMIT, totalBooths);

            emitLog(`Fetching batch ${i + 1} to ${currentMax} of ${totalBooths}...`);

            const chunkPromises = chunk.map(async (booth) => {
                const popupUrl = `https://www.conferenceharvester.com/floorplan/v2/ajaxcalls/ExhibitorInfoPopup.asp?BoothID=${booth.boothID}&EventKey=${eventKey}`;

                try {
                    const popupResponse = await axios.get(popupUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                            'Cookie': cookieString
                        }
                    });

                    const $ = cheerio.load(popupResponse.data);

                    // Updated keys to match OUTPUT_SCHEMA.json
                    let record = {
                        companyName: "N/A",
                        phoneNumber: "N/A",
                        contactName: "N/A",
                        contactEmail: "N/A",
                        country: "N/A",
                        city: "N/A",
                        address: "N/A",
                        booth: booth.boothNumber || "N/A",
                        website: "N/A"
                    };

                    const companyName = $('h1').first().text().trim();
                    if (companyName) record.companyName = companyName;

                    const addressHtml = $('.ExhibitorAddress1').html();

                    if (addressHtml) {
                        const lines = addressHtml.split(/<br\s*\/?>/i)
                            .map(line => cheerio.load(line).text().trim())
                            .filter(line => line.length > 0);

                        lines.forEach(line => {
                            const phoneRegex = /(?:(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}|\b\+?\d{8,15}\b)(?:\s*(?:ext|x|ex)\.?\s*\d+)?/i;

                            if (line.includes('@') && line.includes('.')) {
                                const emailMatch = line.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
                                if (emailMatch) record.contactEmail = emailMatch[0];
                            } else if (line.toLowerCase().includes('http') || line.toLowerCase().includes('www.')) {
                                record.website = line;
                            } else if (phoneRegex.test(line)) {
                                record.phoneNumber = line;
                            } else if (/[A-Z]{2}\s+\d{5}/.test(line) || line.includes(',')) {
                                if (record.city === "N/A" && line !== record.companyName) {
                                    record.city = line;
                                }
                            } else {
                                if (record.address === "N/A" && line !== record.companyName) {
                                    record.address = line;
                                }
                            }
                        });
                    }
                    return record;
                } catch (err) {
                    emitLog(`Error fetching Booth ${booth.boothID}: ${err.message}. Skipping...`);
                    return null;
                }
            });

            const results = await Promise.all(chunkPromises);

            results.forEach(record => {
                if (record) rawRecords.push(record);
            });

            runState?.updateProgress?.(currentMax, totalBooths);
            await new Promise(r => setTimeout(r, 1000));
        }

    } catch (error) {
        emitLog(`FATAL ERROR during scraping: ${error.message}`);
        throw error;
    }

    emitLog("Conference Harvester Engine V5 finished. Passing data to Standardizer.");
    return rawRecords;
};