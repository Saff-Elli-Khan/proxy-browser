import { Page } from "puppeteer";
import { getRandomArrayElement } from "../utils";
import { DefaultNavigationTimeout, RefererList } from "../constants";

export const _readPage = async (
  page: Page,
  options?: {
    xTimesFaster?: number;
  }
) => {
  const { unloaded, scrolls } =
    (await page
      .evaluate(async (options) => {
        let unloaded = false;
        let scrolls: {
          x: number;
          y: number;
          currentX: number;
          currentY: number;
          waitMs: number;
        }[] = [];

        window.addEventListener("beforeunload", () => {
          unloaded = true;
        });

        let height = document.body.scrollHeight;
        let scrolled = 0;
        let stepDivider = 3;
        let steps =
          ((((document.body.textContent ?? "").match(/\w+/g)?.length ?? 0) /
            (600 + ((options ?? {}).xTimesFaster || 1) * 500)) *
            60) /
          stepDivider;
        while (scrolled < height) {
          if (unloaded) break;

          const CurrentScrollPosition = scrolled;
          scrolled += height / steps;
          scrolls.push({
            x: 0,
            y: scrolled,
            currentX: 0,
            currentY: CurrentScrollPosition,
            waitMs: stepDivider * 1000,
          });
        }

        return { unloaded, scrolls };
      }, options)
      .catch(console.error)) ?? {};

  if (!unloaded && scrolls instanceof Array)
    for (const Scroll of scrolls)
      await new Promise((resolve) =>
        setTimeout(async () => {
          await page.mouse.wheel({ deltaY: Scroll.y - Scroll.currentY });
          resolve(0);
        }, Scroll.waitMs)
      );
};

export type ScrollData = {
  scroll: number;
  previousPosition: number;
  currentPosition: number;
  percentage: number;
  waitTimeout: number;
};

export const getScrollingBehavior = (
  availableScroll: number,
  wordCount: number,
  options?: {
    scrollSteps?: number;
    xTimesFaster?: number;
  }
): ScrollData[] => {
  const BehaviorData: ScrollData[] = [];

  const ScrollSteps = options?.scrollSteps || 50;
  const WordsPerStep = Math.ceil(wordCount / 4 / ScrollSteps);
  const ScrollPerStep = availableScroll / ScrollSteps;

  for (let i = 0; i < ScrollSteps; i++)
    BehaviorData.push({
      scroll: ScrollPerStep,
      previousPosition: ScrollPerStep * i,
      currentPosition: ScrollPerStep * (i + 1),
      percentage: Math.round((i / ScrollSteps) * 100),
      waitTimeout: Math.floor(
        (WordsPerStep / ((options?.xTimesFaster || 1) * 1000)) * 60000
      ),
    });

  return BehaviorData;
};

export const readPage = async (
  page: Page,
  options?: {
    scrollSteps?: number;
    xTimesFaster?: number;
  }
) => {
  const { documentHeight, wordCount } = await page.evaluate(() => ({
    documentHeight: document.body.scrollHeight,
    wordCount: (document.body.textContent ?? "").match(/\w+/g)?.length ?? 0,
  }));

  const Scrolls = getScrollingBehavior(documentHeight, wordCount, options);

  for (const { scroll, percentage, waitTimeout } of Scrolls) {
    await page.mouse.wheel({ deltaY: scroll });

    console.info(
      "Activity::",
      `Page scrolled ${percentage}% by ${scroll}px.`,
      `Waiting for ${waitTimeout}ms.`
    );

    await page.waitForTimeout(waitTimeout);
  }

  return page;
};

export const ViewStrategies = [
  async (
    url: URL,
    page: Page,
    options?: {
      continue?: boolean;
      waitForTimeoutMs?: number;
    }
  ) => {
    const TargetUrl = url.toString();

    if (!options?.continue) {
      const Referer = RefererList?.length
        ? getRandomArrayElement(RefererList)
        : "";

      if (Referer) await page.setExtraHTTPHeaders({ Referer });

      console.info(
        "Activity::",
        "Navigating To:",
        TargetUrl,
        "Using Referer:",
        Referer
      );

      await page.goto(TargetUrl, {
        timeout: DefaultNavigationTimeout,
      });
    }

    await page.waitForTimeout(options?.waitForTimeoutMs ?? 10000);

    return page;
  },
  async (
    url: URL,
    page: Page,
    options?: {
      continue?: boolean;
      read?: boolean;
      readXTimesFaster?: number;
      randomlyNavigate?: boolean;
    }
  ) => {
    const TargetUrl = url.toString();

    await ViewStrategies[0](url, page, { continue: options?.continue });

    if (options?.read !== false) {
      console.info("Activity::", "Reading:", TargetUrl);

      await readPage(page, { xTimesFaster: options?.readXTimesFaster });

      console.info("Activity::", "Read Complete:", TargetUrl);
    }

    if (options?.randomlyNavigate !== false) {
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

      if (linksList instanceof Array && linksList.length) {
        const TargetLink = getRandomArrayElement(
          linksList.filter(({ href }) => href !== TargetUrl)
        );

        const TargetSelector = `a[href="${TargetLink.text}"]`;

        if (await page.$(TargetSelector)) {
          await page.hover(TargetSelector).catch(console.error);

          console.info("Activity::", "Visiting:", TargetLink.href);

          await Promise.all([
            page
              .waitForNavigation({ timeout: DefaultNavigationTimeout })
              .catch(console.error),
            page.click(TargetSelector, { delay: 1000 }),
          ]);
        }
      }
    }

    return page;
  },
  async (
    url: URL,
    page: Page,
    options?: {
      continue?: boolean;
    }
  ) =>
    ViewStrategies[1](
      url,
      await ViewStrategies[1](url, page, {
        continue: options?.continue,
        readXTimesFaster: 2,
      }),
      { continue: true }
    ),
] as const;
