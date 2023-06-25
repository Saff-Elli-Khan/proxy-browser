import axios from "axios";
import countries from "./countries.json";
import path from "path";
import fs from "fs";
import Kill from "tree-kill";
import { Argv } from "./constants";
import { SocksProxyAgent } from "socks-proxy-agent";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { getElementAtIndex, getRandomArrayElement } from "./utils";
import {
  getKnownDevices,
  Device,
  generateDevice,
  staticDevices,
} from "./useragent";

const ProxyEnabled =
  Argv.enableProxy ?? Argv.EnableProxy ?? Argv.ENABLE_PROXY ?? true;
const TorEnabled = Argv.tor ?? Argv.Tor ?? Argv.TOR ?? true;
const CustomProxyUrl =
  Argv.proxyURL ??
  Argv.proxyUrl ??
  Argv.ProxyURL ??
  Argv.ProxyUrl ??
  Argv.PROXY_URL;
const ProxyListCmd = (
  (Argv.proxyList ?? Argv.ProxyList ?? Argv.PROXY_LIST) as string | undefined
)?.split(":");
const ProxyListPath = ProxyListCmd?.[0];
const ProxyListRange = ProxyListPath
  ? ProxyListCmd?.[1]?.split("-").map(parseInt).filter(Boolean)
  : undefined;
const ProxyList = ProxyListPath
  ? fs
      .readFileSync(path.join(process.cwd(), ProxyListPath))
      .toString()
      .trim()
      .split(/\n/g)
      .filter(Boolean)
      .slice(ProxyListRange?.[0] ?? 0, ProxyListRange?.[1])
  : undefined;
const TorPort = Argv.torPort ?? Argv.TorPort ?? Argv.TOR_PORT ?? "9050";
const ProxyURLs = ProxyEnabled
  ? CustomProxyUrl
    ? [new URL(CustomProxyUrl)]
    : ProxyList instanceof Array
    ? ProxyList.filter((proxy) => !/^\/\/.*/.test(proxy)).map(
        (proxy) => new URL(proxy)
      )
    : TorEnabled
    ? [new URL("socks5://127.0.0.1:" + TorPort)]
    : []
  : [];
const RawTimeframeMs =
  Argv.timeframeMs ?? Argv.TimeframeMs ?? Argv.TIMEFRAME_MS;
const TimeframeMs =
  typeof RawTimeframeMs === "string" ? RawTimeframeMs : undefined;

export type GeoData = {
  ip: string;
  country: string | null;
  language: string;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracyRadius: number | null;
};

export type BrowserProfile = {
  websites: URL[];
  proxy?: URL;
  device: Device;
} & GeoData;

export type GeoDataOptions = {
  proxy?:
    | {
        https: SocksProxyAgent;
        http: SocksProxyAgent;
      }
    | SocksProxyAgent;
};

export const getGeoData = async (options?: GeoDataOptions): Promise<GeoData> =>
  axios
    .get(
      "http://www.geoplugin.net/json.gp",
      typeof options?.proxy === "object"
        ? {
            httpsAgent:
              options.proxy instanceof SocksProxyAgent
                ? options.proxy
                : options.proxy.http instanceof SocksProxyAgent
                ? options.proxy.http
                : undefined,
            httpAgent:
              options.proxy instanceof SocksProxyAgent
                ? options.proxy
                : options.proxy.https instanceof SocksProxyAgent
                ? options.proxy.https
                : undefined,
          }
        : {}
    )
    .then((res) => ({
      ip: res.data.geoplugin_request,
      country: res.data.geoplugin_countryName,
      language:
        countries[res.data.geoplugin_countryName as keyof typeof countries]
          ?.languages ?? "en-US,en",
      timezone: res.data.geoplugin_timezone,
      latitude:
        res.data.geoplugin_latitude !== null
          ? parseFloat(res.data.geoplugin_latitude)
          : null,
      longitude:
        res.data.geoplugin_longitude !== null
          ? parseFloat(res.data.geoplugin_longitude)
          : null,
      locationAccuracyRadius:
        res.data.geoplugin_locationAccuracyRadius !== null
          ? parseFloat(res.data.geoplugin_locationAccuracyRadius)
          : null,
    }));

export const startTor = () =>
  spawn("tor", [
    "--SocksPort",
    TorPort,
    "--ControlPort",
    (parseInt(TorPort) + 1).toString(),
    "--DataDirectory",
    `./tor/data/${TorPort}`,
  ]);

export const waitForTorStart = (pr: ChildProcessWithoutNullStreams) =>
  new Promise((resolve, reject) => {
    console.info("Connecting to Tor Network...");
    const OutListener = (chunk: Buffer) => {
      if (chunk.toString().includes("Bootstrapped 100% (done): Done")) {
        console.info("Tor network connected!");
        pr.stdout.off("data", OutListener);
        resolve(true);
      }
    };

    pr.stdout.on("data", OutListener);

    const ErrorListener = (error: Error) => {
      pr.off("error", ErrorListener);
      reject(error);
    };

    pr.on("error", ErrorListener);
  });

export const waitForTorClose = (pr: ChildProcessWithoutNullStreams) =>
  new Promise((resolve, reject) => {
    console.log("Waiting for Tor Network to close...");
    const CloseListener = () => {
      pr.off("close", CloseListener);
      resolve(true);
    };

    pr.on("close", CloseListener);

    const ErrorListener = (error: Error) => {
      pr.off("error", ErrorListener);
      reject(error);
    };

    pr.on("error", ErrorListener);
  });

export const stopTor = async (pr: ChildProcessWithoutNullStreams) => {
  if (typeof pr.pid === "number") Kill(pr.pid);
  await waitForTorClose(pr);
  console.log("Tor Network closed!");
  return true;
};

const TorAvailable =
  ProxyEnabled && !CustomProxyUrl && !ProxyList && TorEnabled;
const TargetWebsites = (
  (Argv.w ?? Argv.website ?? Argv.Website ?? Argv.WEBSITE ?? "") as string
)
  .trim()
  .split(/\s*,\s*/g)
  .map((url) => new URL(url));
let GeoDataCache: GeoData | void;

export type BrowserProfileCallback = (
  profile: BrowserProfile,
  index: number
) => void | Promise<void>;

export const forEachBrowserProfile = async (
  profileLimit: number | { limit: number; offset?: number },
  callback: BrowserProfileCallback,
  options?: {
    getProxy?: (ips: URL[], limit: number) => URL[] | Promise<URL[]>;
  }
) => {
  if (
    !["number", "object"].includes(typeof profileLimit) ||
    profileLimit === null
  )
    throw new Error(`Invalid profile limit value!`);

  const LimitOffset =
    typeof profileLimit === "number" ? { limit: profileLimit } : profileLimit;

  const WaitTime = TimeframeMs
    ? eval(TimeframeMs) / LimitOffset.limit
    : undefined;

  const GotIps: URL[] = [];

  let IterationTimestamp: number;

  for (let i = LimitOffset.offset ?? 0; i < LimitOffset.limit; i++) {
    IterationTimestamp = Date.now();

    const ProfileIndex = i + 1;

    if (ProxyEnabled && !ProxyURLs.length) {
      const GetProxyLimit = 5;

      if (
        (!GotIps.length || GotIps.length < ProfileIndex) &&
        i % GetProxyLimit === 0
      )
        await options?.getProxy?.(
          GotIps,
          GotIps.length % GetProxyLimit || GetProxyLimit // If the GotIps length is a random number instead of the multiple of GetProxyLimit, than it should be balanced first.
        );
    }

    const ProxyURL = ProxyEnabled
      ? getElementAtIndex(i, ProxyURLs.length ? ProxyURLs : GotIps)
      : undefined;

    const Tor = TorAvailable ? startTor() : undefined;

    if (Tor) await waitForTorStart(Tor);

    GeoDataCache = !CustomProxyUrl
      ? await getGeoData({
          proxy:
            ProxyURL instanceof URL ? new SocksProxyAgent(ProxyURL) : undefined,
        }).catch((error) =>
          console.error(error.message, "Profile Index:", ProfileIndex)
        )
      : GeoDataCache ??
        (await getGeoData({
          proxy:
            ProxyURL instanceof URL ? new SocksProxyAgent(ProxyURL) : undefined,
        }).catch((error) =>
          console.error(error.message, "Profile Index:", ProfileIndex)
        ));

    if (!GeoDataCache) {
      if (Tor) await stopTor(Tor);
      continue;
    }

    // if (
    //   !(
    //     Argv.disableIpCache ??
    //     Argv.DisableIpCache ??
    //     Argv.DISABLE_IP_CACHE ??
    //     false
    //   )
    // ) {
    //   const IpListKey = `./temp/${new Date()
    //     .toLocaleDateString([], {
    //       day: "2-digit",
    //       month: "2-digit",
    //       year: "numeric",
    //     })
    //     .replace(/\//g, "-")}_${TargetWebsite.hostname}_ips`;
    //   const IpList = await cacheList(IpListKey);

    //   if (IpList.has(GeoDataCache.ip)) {
    //     if (Tor) await stopTor(Tor);
    //     continue;
    //   }

    //   IpList.add(GeoDataCache.ip);

    //   await cacheList(IpListKey, IpList);
    // }

    const KnownDevices =
      Argv.useKnownDevices ?? Argv.UseKnownDevices ?? Argv.USE_KNOWN_DEVICES
        ? Object.values(
            getKnownDevices({
              name: Argv.knownDevice ?? Argv.KnownDevice ?? Argv.KNOWN_DEVICE,
              unIncludeIrregular:
                Argv.unIncludeIrregularBrowsers ??
                Argv.UnIncludeIrregularBrowsers ??
                Argv.UNINCLUDE_IRREGULAR_BROWSERS ??
                false,
              latestThresholdPercentage: parseInt(
                Argv.latestBrowserThresholdPercentage ??
                  Argv.LatestBrowserThresholdPercentage ??
                  Argv.LATEST_BROWSER_THRESHOLD_PERCENTAGE ??
                  "0"
              ),
            })
          )
        : [];

    const GeneratedDevices =
      Argv.useGeneratedDevices ??
      Argv.UseGeneratedDevices ??
      Argv.USE_GENERATED_DEVICES
        ? [
            generateDevice({
              deviceScaleFactor:
                process.env.NODE_ENV === "development" ? 1 : undefined,
              resolution:
                process.env.NODE_ENV === "development"
                  ? [1366, 768]
                  : undefined,
            }),
          ]
        : [];

    const StaticDevices =
      Argv.useStaticDevices ?? Argv.UseStaticDevices ?? Argv.USE_STATIC_DEVICES
        ? staticDevices()
        : [];

    const TargetDevice = getRandomArrayElement([
      ...KnownDevices,
      ...GeneratedDevices,
      ...StaticDevices,
    ]);

    const Profile = {
      websites: TargetWebsites,
      proxy: ProxyURL,
      device: TargetDevice,
      ...GeoDataCache,
    };

    console.info("Browser Profile:", Profile, "Profile Index:", ProfileIndex);

    await callback(Profile, i);

    if (Tor) await stopTor(Tor).catch(console.error);

    if (typeof WaitTime === "number") {
      const FinalWaitTime = WaitTime - (Date.now() - IterationTimestamp);

      console.info("Waiting for:", FinalWaitTime);

      await new Promise((_) => setTimeout(_, FinalWaitTime));
    }
  }
};
