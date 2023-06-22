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
        'input.gLFyf,textarea.gLFyf,input[type="text"][aria-label="Google Search"],textarea[aria-label="Search"],input#lst-ib,textarea#lst-ib';

      await page.waitForSelector(SearchBoxSelector);

      const UniqueSearchBoxSelector = await page
        .evaluate((selector) => {
          const generateQuerySelector = function (el: any): string {
            if (el.tagName.toLowerCase() == "html") return "HTML";
            let str = el.tagName;
            str += el.id != "" ? "#" + el.id : "";
            if (el.className) {
              let classes = el.className.split(/\s/);
              for (let i = 0; i < classes.length; i++) {
                str += "." + classes[i];
              }
            }
            return generateQuerySelector(el.parentNode) + " > " + str;
          };

          const TargetElements = Array.from(
            document.querySelectorAll(selector)
          ).filter((el) =>
            ["input", "textarea"].includes(el.tagName.toLowerCase())
          );

          if (TargetElements.length)
            return generateQuerySelector(TargetElements[0]);

          return null;
        }, SearchBoxSelector)
        .catch(console.error);

      if (!UniqueSearchBoxSelector)
        throw new Error(`Google search box was not found!`);

      console.info(
        "Activity::",
        "Got searchbox selector:",
        UniqueSearchBoxSelector
      );

      await page.hover(UniqueSearchBoxSelector);
      await page.click(UniqueSearchBoxSelector);

      console.info("Activity::", "Searchbox has been focused!");

      for (let char of options?.query || url.hostname)
        await page.keyboard.type(char, { delay: 200 });

      await Promise.all([
        page.waitForNavigation({
          timeout: DefaultNavigationTimeout,
        }),
        page.keyboard.press("Enter", { delay: 500 }),
      ]);

      await page.waitForTimeout(1000);

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

      console.info(
        "Activity::",
        "Search Successful! Navigating to:",
        TargetLink.href
      );

      await Promise.all([
        page.waitForNavigation({
          timeout: DefaultNavigationTimeout,
        }),
        page.click(TargetLinkSelector, { delay: 500 }),
      ]);
    } catch (error) {
      console.warn(error);

      console.info("Activity::", "Navigating Directly!");

      await page.goto(url.toString());
    }

    return page;
  },
};
