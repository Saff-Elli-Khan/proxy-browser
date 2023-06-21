#!/usr/bin/env node
import path from "path";
import { Browser } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AnonymizePlugin from "puppeteer-extra-plugin-anonymize-ua";
import { Argv } from "./constants";
import { BrowserProfile, forEachBrowserProfile } from "./profiles";
import { randomIntegerFromRange, getRandomArrayElement } from "./utils";
import { ViewStrategies } from "./strategies/view";
import { SearchStrategies } from "./strategies/search";
import { scarpeIps } from "./scrape-ips";

// Evasions
import AudioEvasion from "./evasions/audio";
import BatteryEvasion from "./evasions/battery";
import CanvasEvasion from "./evasions/canvas";
import ClientRectsEvasion from "./evasions/clientRects";
import CommonEvasion from "./evasions/common";
import FontsEvasion from "./evasions/fonts";
import HardwareEvasion from "./evasions/hardware";
import NetworkEvasion from "./evasions/network";
import WebGLEvasion from "./evasions/webGL";

const EnableEvasions = Argv.evasions ?? Argv.Evasions ?? Argv.EVASIONS;

const ProfilesOffset = parseInt(
  Argv.offset ?? Argv.Offset ?? Argv.OFFSET ?? "0"
);

const ProfilesLimit = parseInt(
  Argv.l ?? Argv.limit ?? Argv.Limit ?? Argv.LIMIT ?? "100"
);

const RawStrategyIndexCmd = (Argv.strategy ??
  Argv.Strategy ??
  Argv.STRATEGY) as string | undefined;
const StrategyIndexCmd = (
  typeof RawStrategyIndexCmd !== "undefined"
    ? RawStrategyIndexCmd.toString()
    : undefined
)?.split("?");
const StrategyIndex = StrategyIndexCmd?.[0];
const StrategyOpts = StrategyIndex
  ? StrategyIndexCmd?.[1]?.split("&").reduce((opts, kv) => {
      const Kv = kv.split("=");
      return {
        ...opts,
        [Kv[0]]: eval(Kv[1]),
      };
    }, {})
  : undefined;

const createPage = async (browser: Browser, profile: BrowserProfile) => {
  const TargetPage = await browser.newPage();

  if (profile.latitude && profile.longitude)
    await TargetPage.setGeolocation({
      latitude: profile.latitude,
      longitude: profile.longitude,
    });
  if (profile.timezone) await TargetPage.emulateTimezone(profile.timezone);
  if (profile.language) {
    await TargetPage.setExtraHTTPHeaders({
      "Accept-Language": profile.language,
    });
    await TargetPage.evaluateOnNewDocument((language) => {
      // Update current Language
      const Languages = language.split(/\s*,\s*/g);

      Object.defineProperty(navigator, "language", {
        get: function () {
          return Languages[0];
        },
      });

      Object.defineProperty(navigator, "languages", {
        get: function () {
          return Languages;
        },
      });
    }, profile.language);
  }

  if (EnableEvasions !== false) {
    console.log("Activity::", "Updating page fingerprint!");

    if (profile.device) await TargetPage.emulate(profile.device);

    // Implement Evasions
    await AudioEvasion(TargetPage);
    await BatteryEvasion(TargetPage);
    await CanvasEvasion(TargetPage);
    await ClientRectsEvasion(TargetPage);
    await CommonEvasion(TargetPage, {
      googleAnalytics: false,
      device: profile.device,
    });
    await FontsEvasion(TargetPage);
    await HardwareEvasion(TargetPage);
    await NetworkEvasion(TargetPage);
    await WebGLEvasion(TargetPage, {
      device: profile.device,
    });
  }

  return TargetPage;
};

async function main() {
  await forEachBrowserProfile(
    {
      offset: ProfilesOffset,
      limit: ProfilesLimit,
    },
    async (profile) => {
      try {
        if (!profile.websites.length) {
          console.log("Not websites provided! Skipping...");
          return;
        }

        if (EnableEvasions !== false) {
          puppeteer.use(StealthPlugin());
          puppeteer.use(AnonymizePlugin());
        }

        const Browser = await puppeteer.launch({
          headless:
            Argv.headless ?? Argv.HEADLESS ?? Argv.Headless ?? true
              ? "new"
              : false,
          devtools: Argv.devtools ?? Argv.DevTools ?? Argv.DEV_TOOLS ?? false,
          ignoreHTTPSErrors: true,
          defaultViewport: null,
          args: [
            profile.proxy ? `--proxy-server=${profile.proxy}` : "",
            `--lang=${profile.language}`,

            ...(EnableEvasions !== false
              ? [
                  "--single-process",
                  "--no-zygote",
                  "--disable-features=WebRtcHideLocalIpsWithMdns",
                  "--disable-webrtc-encryption",
                  "--disable-rtc-smoothness-algorithm",
                  "--disable-setuid-sandbox",
                  "--disable-sandbox",
                  "--no-sandbox",
                  "--disable-dev-shm-usage",
                  "--disable-software-rasterizer",
                  "--disable-web-security",
                  "--disable-features=IsolateOrigins,site-per-process",
                  "--disable-client-side-phishing-detection",
                  "--disable-sync",
                  "--no-default-browser-check",
                  "--no-first-run",
                  "--disable-incremental-layout",
                  "--disable-threaded-scrolling",
                  "--disable-histogram-customizer",
                  "--disable-infobars",
                  "--disable-logging",
                  `--window-size=${profile.device.viewport.width},${profile.device.viewport.height}`,
                ]
              : []),
          ].filter(Boolean),
          userDataDir: path.join(
            process.cwd(),
            "./puppeteer/data/",
            profile.ip
          ),
          protocolTimeout: 180_000 * 100,
        });

        const ResolvedStrategyIndex = parseInt(
          (
            StrategyIndex ??
            randomIntegerFromRange(0, ViewStrategies.length - 1)
          ).toString()
        );
        const TargetStrategy = ViewStrategies[ResolvedStrategyIndex];

        console.info("Activity::", "Selected Strategy:", ResolvedStrategyIndex);

        if (typeof TargetStrategy !== "function")
          throw new Error(
            `We didn't found the target strategy index ${ResolvedStrategyIndex}!`
          );

        await Promise.all(
          profile.websites.map((url) =>
            getRandomArrayElement(
              [
                (Argv.searchQuery ?? Argv.SearchQuery ?? Argv.SEARCH_QUERY) ===
                false
                  ? (undefined as any)
                  : async () =>
                      TargetStrategy(
                        url,
                        await SearchStrategies.google(
                          url,
                          await createPage(Browser, profile),
                          {
                            query:
                              Argv.searchQuery ??
                              Argv.SearchQuery ??
                              Argv.SEARCH_QUERY,
                          }
                        ),
                        {
                          ...StrategyOpts,
                          continue: true,
                        }
                      ),
                ...(Argv.searchOnly ?? Argv.SearchOnly ?? Argv.SEARCH_ONLY
                  ? []
                  : [
                      async () =>
                        TargetStrategy(
                          url,
                          await createPage(Browser, profile),
                          StrategyOpts
                        ),
                    ]),
              ].filter(Boolean)
            )()
          )
        ).catch(console.error);

        Browser.close();

        console.info("Activity::", "Browser Closed!");
      } catch (error) {
        console.error(error);
      }
    },
    {
      getProxy:
        Argv.scrapeIps ?? Argv.ScrapeIps ?? Argv.SCRAPE_IPS
          ? async (ips, limit) => {
              const Ips: string[] = [];

              await scarpeIps({
                ipcount: limit,
                ips: Ips,
                argv: Argv,
              }).catch(console.error);

              for (const Ip of Ips) ips.push(new URL(Ip));

              return ips;
            }
          : undefined,
    }
  );
}

main().catch(console.error);
