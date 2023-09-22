import { chromium } from "playwright-extra";
import path from "path";
import { publicIpv4 } from "public-ip";
import stealth from "puppeteer-extra-plugin-stealth";
import userAgent from "user-agents";

import { log } from "./logger.js";

chromium.use(stealth);

// const { firefox } = require('playwright-extra')

// // Add humanize plugin
// const HumanizePlugin = require('@extra/humanize')
// firefox.use(
//   HumanizePlugin({
//     mouse: {
//       showCursor: true // Show the cursor (meant for testing)
//     }
//   })
// )

const screenshotFolder = "screenshots";
const scriptName = path.basename(process.argv[1]);
const url = "https://www.google.com";

chromium
  .launch({
    headless: true,
  })
  .then(async (browser) => {
    // Create a new incognito browser context with a proper user agent
    const context = await browser.newContext({
      userAgent: userAgent.toString(),
    });

    const timeoutMs = 20e3;
    context.setDefaultTimeout(timeoutMs);

    const page = await context.newPage();
    const myPublicIP = await publicIpv4();
    log.info({ public_IP_address: myPublicIP });

    try {
      const googleSearch = new GoogleSearch(context);
      await googleSearch.loadUrl(url);
      await googleSearch.search("chapati Salmorreta alicantina");
      // await googleSearch.nextPage();
      const links = await googleSearch.getResultLinks();
      var targetLink = null;
      for (const link of links) {
        const text = await link.innerText();
        console.log(`Link Text: ${text}`);
        if (text.includes("Chapati - Más que recetas")) {
          targetLink = link;
        }
      }
      await googleSearch.clickOnLink(targetLink);
    } catch (error) {
      log.error(error);
    }

    log.info(`All done in ${scriptName} ✨`);
    await browser.close();
  });

class GoogleSearch {
  constructor(context, Utils) {
    this.context = context;
    this.Utils = Utils;
    this.lang = "en"; // Default language
  }

  static attrs = {
    rejectCookiesButton: {
      en: "Reject all",
      es: "Rechazar todo",
    },
    nextButton: {
      en: "Next",
      es: "Siguiente",
    },
  };

  async loadUrl(url) {
    this.page = await this.context.newPage();
    await this.page.goto(url);
    await this.page.screenshot({ path: `${screenshotFolder}/01_gotoUrl.png` });

    await this.page.waitForTimeout(2000);
  }

  async search(text) {
    // Type the search query in the search box and press Enter
    await this.page.fill('input[name="q"]', text);
    await this.page.press('input[name="q"]', "Enter");

    // Click "Reject all" cookies button
    try {
      const buttonText = GoogleSearch.attrs.rejectCookiesButton[this.lang];
      await this.page.getByRole("button", { name: buttonText }).click();
    } catch (error) {
      this.lang = "es";
      const buttonText = GoogleSearch.attrs.rejectCookiesButton[this.lang];
      await this.page.getByRole("button", { name: buttonText }).click();
    }

    await this.page.waitForTimeout(1000);
    await this.page.screenshot({
      path: `${screenshotFolder}/02_searchResults.png`,
    });
  }

  async nextPage() {
    const buttonText = GoogleSearch.attrs.nextButton[this.lang];
    await this.page.getByRole("link", { name: buttonText }).click();
    await this.page.waitForTimeout(1000);
    await this.page.screenshot({
      path: `${screenshotFolder}/02_searchResults.png`,
    });
  }

  async getResultLinks() {
    // Get all links on the page
    const allLinks = await this.page.$$("a");

    // Loop through the links and print their text and href attributes
    var linksToResults = [];
    for (const link of allLinks) {
      const text = await link.innerText();
      const href = await link.getAttribute("href");
      const hrefPrefix = "/url?q=";
      if (href.includes(hrefPrefix)) {
        console.log(`Link Text: ${text}`);
        console.log(`Link Href: ${href}`);
        linksToResults.push(link);
      }
    }

    return linksToResults;
  }

  async clickOnLink(linkElement) {
    const text = await linkElement.innerText();
    await this.page.getByRole("link", { name: text }).click();
    await this.page.waitForTimeout(15000);
    await this.page.screenshot({
      path: `${screenshotFolder}/04_targetPage.png`,
    });
    await this.page.waitForTimeout(15000);
  }
}
