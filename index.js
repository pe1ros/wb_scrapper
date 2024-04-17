require('dotenv').config();
const puppeteer = require('puppeteer');

async function scrollToBottom(page, pageIndex) {
  console.log(`<======= SCROLL PAGE =======> ${pageIndex}`);
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const scrollHeight = document.documentElement.scrollHeight;
      const distance = 100;
      let count = 0;

      const interval = setInterval(() => {
        window.scrollBy(0, distance);
        count += 1;

        if (count * distance >= scrollHeight) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });
  });
}

async function autoSearchAndScroll() {
  console.log('<======= LAUNCH BROWSER =======>');
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  let nextPageButtonExists = true;
  let prevIndex = 1;

  console.log(`<======= GO TO =======> ${process.env.URL}`);
  await page.goto(process.env.URL);
  await page.waitForSelector('.search-catalog__input');
  await page.evaluate(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  });
  await page.type('.search-catalog__input', process.env.QUERY);
  await page.keyboard.press('Enter');

  await page.waitForSelector('.searching-results__inner');

  while (nextPageButtonExists) {
    const url = await page.url();
    const match = url.match(/page=(\d+)/);
    const index = match ? parseInt(match[1]) : 'UNKNOWN_MAYBE_1';

    if(prevIndex === index) {
      break;
    }
    prevIndex = index;

    await scrollToBottom(page, index);

    await page.evaluate(() => {
      const nextPageButton = document.querySelector('.pagination__next');
      if (nextPageButton) {
        nextPageButton.click();
        return true;
      }
      return false;
    });
  }

  console.log('<======= CLOSE BROWSER =======>');
  await browser.close();
}

autoSearchAndScroll();
