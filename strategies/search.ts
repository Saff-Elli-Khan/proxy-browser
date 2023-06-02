import { Page } from "puppeteer";
import { DefaultNavigationTimeout } from "../constants";

export const SearchStrategies = {
  google: async (
    url: URL,
    page: Page,
    options?: {
      query?: string;
    }
  ) => {
    await page.goto("https://google.com", {
      timeout: DefaultNavigationTimeout,
    });

    const SearchBoxSelector =
      '.gLFyf,input[type="text"][aria-label="Google Search"],textarea[aria-label="Search"]';

    await page.waitForSelector(SearchBoxSelector);
    await page.hover(SearchBoxSelector);
    await page.click(SearchBoxSelector);

    console.info("Activity::", "Searchbox has been focused!");

    for (let char of options?.query || url.hostname) {
      await page.waitForTimeout(200);
      await page.keyboard.type(char);
    }

    await page.keyboard.press("Enter", { delay: 500 });

    await page.waitForNavigation({
      timeout: DefaultNavigationTimeout,
    });

    const linksList = (
      await page
        .evaluate(() => {
          const linkElements = Array.from(document.querySelectorAll("a"));
          const links = linkElements
            .filter((element) => element.href)
            .map((element) => element.href);

          return links;
        })
        .catch(console.error)
    )?.filter((link) => link.includes(url.hostname));

    console.info("Activity::", "Matched Links:", linksList);

    if (!linksList || !linksList.length)
      throw new Error(
        `We didn't found the exptected host on the Google's search list!`
      );

    const TargetLink = linksList[0];
    const TargetLinkSelector = `a[href="${TargetLink}"]`;

    await page.mouse.wheel({ deltaY: 300 });
    await page.hover(TargetLinkSelector);

    console.info("Activity::", "Navigating to:", TargetLink);

    await Promise.all([
      page.waitForNavigation({
        timeout: DefaultNavigationTimeout,
      }),
      page.click(TargetLinkSelector, { delay: 500 }),
    ]);

    return page;
  },
};
