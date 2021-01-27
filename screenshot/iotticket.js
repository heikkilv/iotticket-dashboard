// Copyright (c) Tampere University 2020.
// This software has been developed in ProCemPlus-project funded by Business Finland.
// This code is licensed under the MIT license.
// See the LICENSE.txt in the project root for the license terms.
//
// Main author(s): Ville Heikkila

const fs = require("fs");
const puppeteer = require("puppeteer");

const screenshot_start_index = parseInt(process.env.SCREENSHOT_START_INDEX);

const maxBrowserSetupTries = 5;
const mSecsPerDay = 86400000;
const errorMessageLimit = 100;
const minConsoleMessageInterval = 300;
var receivedErrorMessagesTotal = 0;
var latestConsoleMessage = Math.round((new Date()).getTime() / 1000);

const iotticketUsername = process.env.IOTTICKET_USERNAME;
const iotticketPassword = process.env.IOTTICKET_PASSWORD;
const dashboardListFile = process.env.dashboard_list;
const screenshotWidth = parseInt(process.env.screenshot_width);
const screenshotHeight = parseInt(process.env.screenshot_height);
const screenshotInterval = parseInt(process.env.screenshot_interval);
const loginWait = parseInt(process.env.login_wait);
const initialWait = parseInt(process.env.initial_wait);
const mouseWait = 500;
const useErrorCheck = (process.env.use_error_check === "true") ? true : false;
var restartTimes = process.env.restart_times.split(",");
restartTimes.sort();

// These mouse positions are used for hiding the tray in IoT-Ticket dashboards.
const mouseX1 = 0.879 * screenshotWidth;
const mouseX2 = 0.979 * screenshotWidth;
const mouseY1 = 0.907 * screenshotHeight;
const mouseY2 = mouseY1;

const serviceErrorMessage = "service unavailable";

const dashboardUrls = fs.readFileSync(dashboardListFile, "utf8").split("\n");
var dashboardIndexes = {};
dashboardUrls.forEach((dashboardUrl, index) => {
    dashboardIndexes[dashboardUrl] = index + 1;
});

function getScreenshotFilename(number) {
    return "screenshots/dashboard_" + (number + screenshot_start_index).toString() + ".png";
}

const delay = ms => new Promise(res => setTimeout(res, ms));

function getNextTime(clockTimes) {
    try {
        const clockDatetimes = clockTimes.map(clockTime => {
            const timeParts = clockTime.split(":");
            const clockDatetime = new Date();
            clockDatetime.setHours(timeParts[0]);
            clockDatetime.setMinutes(timeParts[1]);
            clockDatetime.setSeconds(timeParts[2]);
            clockDatetime.setMilliseconds(0);
            return clockDatetime;
        });

        for (const clockDatetime of clockDatetimes) {
            if (clockDatetime > Date.now()) {
                return clockDatetime;
            }
        }

        // The next restart will be in the next day.
        const nextClockDatetime = new Date();
        nextClockDatetime.setTime(Math.min(...clockDatetimes) + mSecsPerDay);
        return nextClockDatetime;
    }

    catch(error) {
        console.log(new Date(), error, "in getNextTime");
        return new Date();
    }
}

async function getBrowser() {
    try {
        const browser = await puppeteer.launch({
            executablePath: "google-chrome-stable",
            args: [
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--window-size=".concat(screenshotWidth.toString(), ",", screenshotHeight.toString())
            ]
        });
        return browser;
    }

    catch(error) {
        console.log(new Date(), error, "in getBrowser");
        return null;
    }
}

async function setupBrowserPage(browser, dashboardUrl, dummy = false) {
    try {
        var usedDashboardUrl = dashboardUrl;
        if (dummy) {
            if (dashboardUrl.includes('?')) {
                usedDashboardUrl += '&';
            }
            else {
                usedDashboardUrl += '?';
            }
            usedDashboardUrl += "dummypage=true";
        }

        const pages = await browser.pages();
        const pageUrls = pages.map(page => page.url());
        if (pageUrls.includes(usedDashboardUrl)) {
            console.log(new Date(), "Page " + usedDashboardUrl + " already exists.");
            return;
        }

        const page = await browser.newPage();
        await page.setViewport({
            width: screenshotWidth,
            height: screenshotHeight,
            deviceScaleFactor: 1
        });

        // handle the session login process
        await page.goto(usedDashboardUrl, {waitUntil: "domcontentloaded"});
        await delay(loginWait);
        await page.keyboard.type(iotticketUsername);
        await delay(loginWait);
        await page.keyboard.press("Tab");
        await page.keyboard.type(iotticketPassword);
        await delay(loginWait);
        await page.keyboard.press("Tab");
        await page.keyboard.press("Enter");
        await delay(loginWait);

        // load the proper dashboard
        const result = await page.goto(usedDashboardUrl, {waitUntil: "domcontentloaded"});
        if (result !== null && typeof result.status === 'function' && result.status() !== 200) {
            console.log(new Date(), "Closing page " + usedDashboardUrl + " because of status code " + result.status());
            page.close();
            return;
        }
        const pageContent = await page.content();
        if (pageContent.toLowerCase().includes(serviceErrorMessage)) {
            console.log(new Date(), "Closing page " + usedDashboardUrl + " because of text: " + serviceErrorMessage);
            page.close();
            return;
        }

        await delay(initialWait / 5);
        console.log(await page.url());

        // hide the tray on the dashboard
        await page.mouse.move(mouseX1, mouseY1);
        await delay(mouseWait);
        await page.mouse.move(mouseX2, mouseY2, {steps: 10});
        await delay(mouseWait);
        await page.mouse.down();
        await delay(mouseWait);
        await page.mouse.up();
        await delay(mouseWait);
        await page.mouse.move(mouseX1, mouseY1, {steps: 10});
        await delay(mouseWait);
        await page.mouse.down();
        await delay(mouseWait);
        await page.mouse.move(mouseX1/2, mouseY1/2, {steps: 40});
        await delay(mouseWait);
    }

    catch(error) {
        console.log(new Date(), error, "in setupBrowserPage");
    }
}

function addConsoleListener(page) {
    // modified from https://stackoverflow.com/questions/58089425/
    // on how to print out the console messages with a hack that works in puppeteer 1.20.0
    try {
        page.on("console", (msg) => {
            try {
                const cleanMessage = msg.args()
                                        .map(arg => arg.toString()
                                                    .substr(9))
                                        .join(" ");

                if (cleanMessage.includes("error")) {
                    receivedErrorMessagesTotal += 1;
                }
                latestConsoleMessage = Math.round((new Date()).getTime() / 1000);
            }

            catch(error) {
                console.log(new Date(), error, "in console listener");
            }
        });
    }

    catch(error) {
        console.log(new Date(), error, "in addConsoleListener");
    }
}

async function checkBrowserSetup(browser) {
    try {
        // close unnecessary pages
        var pages = await browser.pages();
        var previousUrls = [];
        var useDelay = false;
        for (const page of pages) {
            const pageUrl = await page.url();
            if (!dashboardUrls.includes(pageUrl)) {
                console.log(new Date(), "Removing page: " + pageUrl);
                page.close();
                useDelay = true;
            }
            else if (previousUrls.includes(pageUrl)) {
                console.log(new Date(), "Removing duplicate page: " + pageUrl);
                page.close();
                useDelay = true;
            }
            else {
                previousUrls.push(pageUrl);
            }
        }

        // If pages were closed, wait a bit before loading the new page list.
        if (useDelay) {
            await delay(loginWait);
        }

        // Check that all needed pages are available
        // and that there has not been too many error messages in the page, if error checking is on.
        pages = await browser.pages();
        const pageUrls = pages.map(page => page.url());
        if (pageUrls.length !== dashboardUrls.length) {
            console.log(new Date(), "Wrong number of pages: " + pageUrls.length);
            return false;
        }

        for (const dashboardUrl of dashboardUrls) {
            if (!pageUrls.includes(dashboardUrl)) {
                console.log(new Date(), "Missing: " + dashboardUrl);
                return false;
            }
        }

        if (useErrorCheck) {
            if (receivedErrorMessagesTotal >= errorMessageLimit) {
                console.log(new Date(), "Too many error messages: (" + receivedErrorMessagesTotal.toString() + ")");
                return false;
            }

            const messageInterval = Math.round((new Date()).getTime() / 1000) - latestConsoleMessage;
            if (messageInterval >= minConsoleMessageInterval) {
                console.log(new Date(), "No console messages: (" + messageInterval.toString() + " seconds)");
                return false;
            }
        }
    }

    catch(error) {
        console.log(new Date(), error, "in checkBrowserSetup");
        return false;
    }

    return true;
}

async function takeScreenshot(page) {
    var check = false;

    try {
        const pageUrl = await page.url();
        const pageIndex = dashboardIndexes[pageUrl];
        // console.log(new Date(), pageUrl, getScreenshotFilename(pageIndex));
        await page.screenshot({
            path: getScreenshotFilename(pageIndex)
        });
        check = true;
    }

    catch(error) {
        console.log(new Date(), error, "in takeScreenshot");
    }

    return check;
}

async function takeScreenshotsUntilRestart(browser, nextRestartTime) {
    console.log(new Date(), "Starting screenshots");
    try {
        const pages = await browser.pages();
        if (useErrorCheck) {
            // Add console listeners that take note on error messages.
            pages.forEach(addConsoleListener);
        }

        latestConsoleMessage = Math.round((new Date()).getTime() / 1000);
        var previousTime = Date.now();
        var timeNow = Date.now();
        while (timeNow < nextRestartTime) {
            const waitTime = Math.max(screenshotInterval - (timeNow - previousTime), screenshotInterval / 10);
            await delay(waitTime);

            const setupOk = await checkBrowserSetup(browser);
            previousTime = Date.now();

            var screenshotCheck = true;
            if (setupOk) {
                const screenshotChecks = await Promise.all(pages.map(takeScreenshot));
                if (screenshotChecks.includes(false)) {
                    screenshotCheck = false;
                }
            }

            if (!setupOk || !screenshotCheck) {
                console.log(new Date(), "Restarting browser because the setup is not ok.");
                return;
            }

            timeNow = Date.now();
        }
    }

    catch(error) {
        console.log(new Date(), error, "in takeScreenshotsUntilRestart");
    }

    console.log(new Date(), "Closing and restarting the browser for a scheduled restart.");
    return;
}

async function startBrowser() {
    async function verboseSetupBrowserPage(browser, dashboardUrl) {
        console.log(new Date(), "Setting up:", dashboardIndexes[dashboardUrl], dashboardUrl);
        try {
            await setupBrowserPage(browser, dashboardUrl);
        }

        catch(error) {
            console.log(new Date(), error, "in verboseSetupBrowserPage");
        }
    }

    try {
        console.log("screenshot_start_index", screenshot_start_index);
        receivedErrorMessagesTotal = 0;
        latestConsoleMessage = Math.round((new Date()).getTime() / 1000);

        const nextRestartTime = getNextTime(restartTimes);
        console.log(new Date(), "Next browser restart is scheduled for", nextRestartTime);
        const browser = await getBrowser();

        var setupFinished = false;
        // Load first a extra dummy dashboard page because the first opened page seems to display differently.
        await setupBrowserPage(browser, dashboardUrls[0], true);

        var counter = 0;
        while (!setupFinished) {
            counter++;
            for (const dashboardUrl of dashboardUrls) {
                await verboseSetupBrowserPage(browser, dashboardUrl);
            }
            await delay(4 * initialWait / 5);
            setupFinished = await checkBrowserSetup(browser);

            if (counter >= maxBrowserSetupTries) {
                console.log(new Date(), counter, "browser setup tries used => closing browser");
                await browser.close();
                return;
            }
        }

        await takeScreenshotsUntilRestart(browser, nextRestartTime);
        await browser.close();
    }

    catch(error) {
        console.log(new Date(), error, "in startBrowser");
        if (typeof browser !== "undefined" && typeof browser.close === 'function') {
            await browser.close();
        }
    }

    return true;
}

async function startProcess() {
    while (true) {
        try {
            console.log(new Date(), "Starting a new browser.");
            await startBrowser();
            console.log(new Date(), "Restarting the browser shortly.");
            await delay(initialWait / 2);
        }

        catch(error) {
            console.log(new Date(), error, "in startProcess");
            await delay(initialWait / 2);
        }
    }
}

startProcess();
