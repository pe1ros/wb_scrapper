require('dotenv').config();
const puppeteer = require('puppeteer');

let oppenedCards = [];

async function scrollToBottom(page, pageIndex) {
  await page.evaluate(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  });

  console.log(`<======= SCROLL PAGE =======> ${pageIndex}`);
  await page.evaluate(async () => {
    await new Promise((resolve, _) => {
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
      }, 100);
    });
  });
}

async function openRandomCard(page) {
  await page.evaluate(() => {
    const productCard = document.querySelector('.product-card__link');
    if (productCard) {
      productCard.click();
    }
  });
  await page.evaluate(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  });
  const url = await page.url();
  if (oppenedCards.length && oppenedCards.findIndex(e => e === url) !== -1) {
    await page.goBack();
    return false;
  }
  console.log('<======= OPEN PRODUCT CARD =======>', url);
  oppenedCards.push(url);
  await page.goBack();
  return true;
}

async function hasCards (page) {
  const productCards = await page.$$('.product-card');
  const productCardsWr = await page.$$('.product-card__wrapper');
  return productCards.length > 3 || productCardsWr.length > 3;
}

async function autoSearchAndWatchResults() {
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

    // if(!hasCards(page)) {
    //   continue;
    // }

    if(prevIndex === index) {
      break;
    }
    prevIndex = index;

    if (typeof prevIndex === 'number' && prevIndex % 3 == 0) {
      const success = await openRandomCard(page);
      if(!success) {
        console.log('<======= BREAK LOOP CAUSE MIRROR URL =======>');
        break;
      }
    } else {
      await scrollToBottom(page, index);
    }

    await page.evaluate(() => {
      const nextPageButton = document.querySelector('.pagination__next');
      if (nextPageButton) {
        nextPageButton.click();
      }
    });
  }

  console.log('<======= CLOSE BROWSER =======>');
  await browser.close();
}

autoSearchAndWatchResults();
