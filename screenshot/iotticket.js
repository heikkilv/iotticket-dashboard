const puppeteer = require("puppeteer");

const iotticketUsername = process.env.IOTTICKET_USERNAME;
const iotticketPassword = process.env.IOTTICKET_PASSWORD;

const url1 = "https://tiketti.ain.rd.tut.fi/Dashboard/#desktop/QRY9g8zbJQ7UqacQwRQpT7/1";
const url2 = "https://tiketti.ain.rd.tut.fi/Dashboard/#desktop/tiYwkX4tjD4fCwMDfjnTx5/1";
const screenshotFilename1 = "screenshots/dashboard_1.png";
const screenshotFilename2 = "screenshots/dashboard_2.png";
const waitTimeMs = 5000;

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run (dashboardUrl, screenshotFilename) {
    const browser = await puppeteer.launch({
        executablePath: "google-chrome-unstable",
        args: ["--no-sandbox", "--disable-dev-shm-usage", "--window-size=1920,1080"]
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
    });

    // handle the IoT-Ticket session login
    await page.goto(dashboardUrl);
    await page.keyboard.type(iotticketUsername);
    await page.keyboard.press("Tab");
    await page.keyboard.type(iotticketPassword);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await delay(waitTimeMs);

    // load the proper dashboard
    await page.goto(dashboardUrl);

    // take periodic screenshots from the dashboard
    while (true) {
        await delay(waitTimeMs);
        await page.screenshot({path: screenshotFilename});
    }

    // browser.close();
}

run(url1, screenshotFilename1);
run(url2, screenshotFilename2);
