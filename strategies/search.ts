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
    try {
      await page.goto("https://google.com", {
        timeout: DefaultNavigationTimeout,
      });

      const SearchBoxSelector =
        '.gLFyf,input[type="text"][aria-label="Google Search"],textarea[aria-label="Search"],#lst-ib';

      await page.waitForSelector(SearchBoxSelector);
      await page.hover(SearchBoxSelector);
      await page.click(SearchBoxSelector);

      console.info("Activity::", "Searchbox has been focused!");

      for (let char of options?.query || url.hostname) {
        await page.waitForTimeout(200);
        await page.keyboard.type(char);
      }

      await Promise.all([
        page.waitForNavigation({
          timeout: DefaultNavigationTimeout,
        }),
        page.keyboard.press("Enter", { delay: 500 }),
      ]);

      const linksList = await page
        .evaluate((host) => {
          const linkElements = Array.from(document.querySelectorAll("a"));
          const links = linkElements
            .filter((element) => element.getAttribute("href")?.includes(host))
            .map((element) => ({
              href: element.href,
              text: element.getAttribute("href")!,
            }));

          return links;
        }, url.hostname)
        .catch(console.error);

      console.info("Activity::", "Matched Links:", linksList);

      if (!linksList || !linksList.length)
        throw new Error(
          "We didn't found the exptected host on the Google's search list!"
        );

      const TargetLink = linksList[0];
      const TargetLinkSelector = `a[href="${TargetLink.text}"]`;

      await page.mouse.wheel({ deltaY: 300 });
      await page.waitForTimeout(500);
      await page.mouse.wheel({ deltaY: 300 });
      await page.waitForTimeout(500);
      await page.mouse.wheel({ deltaY: 300 });

      await page.waitForTimeout(1000);
      await page.hover(TargetLinkSelector);

      console.info("Activity::", "Navigating to:", TargetLink.href);

      await Promise.all([
        page.waitForNavigation({
          timeout: DefaultNavigationTimeout,
        }),
        page.click(TargetLinkSelector, { delay: 500 }),
      ]);
    } catch (error) {
      console.warn(error);
      await page.goto(url.toString());
    }

    return page;
  },
};
