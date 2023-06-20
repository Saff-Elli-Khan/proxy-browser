import { KnownDevices, Device as KnownDevice } from "puppeteer";
import UAParser, { Agent } from "useragent";
import UserAgent from "user-agents";
import { getRandomArrayElement, getXPercentFromRange } from "./utils";

const Devices: any = {};
const Evaluation: any = {};
const RegularBrowsers = ["chrome", "firefox", "safari", "amazon"];

for (let Key in KnownDevices)
  if (KnownDevices.hasOwnProperty(Key)) {
    const UAP = UAParser.parse(
      KnownDevices[Key as keyof typeof KnownDevices].userAgent
    );

    Devices[Key] = {
      ...KnownDevices[Key as keyof typeof KnownDevices],
      userAgentDetails: UAP,
      isRegular: RegularBrowsers.reduce(
        (is, browser) =>
          is || UAP.family.toLowerCase().includes(browser.toLowerCase()),
        false
      ),
    };

    Evaluation[UAP.family] = Evaluation[UAP.family] ?? {};

    const Version = parseFloat(UAP.major);

    Evaluation[UAP.family].latest = Evaluation[UAP.family].latest
      ? Evaluation[UAP.family].latest >= Version
        ? Evaluation[UAP.family].latest
        : Version
      : Version;

    Evaluation[UAP.family].oldest = Evaluation[UAP.family].oldest
      ? Evaluation[UAP.family].oldest <= Version
        ? Evaluation[UAP.family].oldest
        : Version
      : Version;

    Evaluation[UAP.family].count = (Evaluation[UAP.family].count ?? 0) + 1;
  }

export type Device = KnownDevice & {
  platform?: string;
  screen?: {
    width: number;
    height: number;
    depth: number;
    orientation?: {
      type?: string;
      angle?: number;
    };
  };
  webGL?: {
    vendor: string;
    renderer: string;
    unmaskedVendor: string;
    unmaskedRenderer: string;
  };
  userAgentDetails: Agent;
  userAgentData?: {
    vendor?: string;
    brands?: Array<{ brand: string; version: string }>;
    mobile?: boolean;
    platform?: string;
    platformVersion?: string;
    architecture?: string;
    bitness?: number | string;
    model?: string;
    uaFullVersion?: string;
    fullVersionList?: Array<{ brand: string; version: string }>;
  };
  maxTouchPoints?: number;
  isRegular: boolean;
};

export const getKnownDevices = (options?: {
  name?: string;
  unIncludeIrregular?: boolean;
  latestThreshold?: number;
}): Record<keyof typeof KnownDevices, Device> => {
  if (typeof options === "object" && options !== null) {
    const FilteredDevices: any = {};

    for (let Key in Devices)
      if (Devices.hasOwnProperty(Key)) {
        const TargetDevice = Devices[Key];
        const TargetFamily = TargetDevice.userAgentDetails.family as string;

        if (
          (!options.unIncludeIrregular || TargetDevice.isRegular) &&
          (typeof options.latestThreshold !== "number" ||
            parseFloat(TargetDevice.userAgentDetails.major) >=
              getXPercentFromRange(
                Evaluation[TargetFamily].oldest,
                Evaluation[TargetFamily].latest,
                options.latestThreshold
              ))
        )
          FilteredDevices[Key] = TargetDevice;
      }

    return typeof options.name === "string"
      ? [FilteredDevices[options.name]]
      : FilteredDevices;
  } else return Devices;
};

export const calculateDeviceScaleFactor = (
  deviceSizeInInches: number,
  deviceResolution: [number, number]
): number =>
  Math.sqrt(
    Math.pow(deviceResolution[0], 2) + Math.pow(deviceResolution[1], 2)
  ) /
  deviceSizeInInches /
  100;

export const generateDevice = (options?: {
  filter?: {
    platform?: string;
    deviceCategory?: "desktop" | "tablet" | "mobile";
  };
  resolution?: [number, number];
  deviceScaleFactor?: number;
}): Device => {
  const UA = new UserAgent(
    JSON.parse(
      JSON.stringify({
        platform: options?.filter?.platform,
        deviceCategory: options?.filter?.deviceCategory ?? "desktop",
      })
    )
  );

  const Resolution: [number, number] =
    options?.resolution instanceof Array && options.resolution.length === 2
      ? options.resolution
      : [UA.data.screenWidth, UA.data.screenHeight];

  return {
    userAgent: UA.toString(),
    viewport: {
      width: Resolution[0],
      height: Resolution[1],
      deviceScaleFactor:
        options?.deviceScaleFactor ??
        calculateDeviceScaleFactor(
          getRandomArrayElement([11.6, 12, 13.3, 14, 15.6, 16]),
          Resolution
        ),
      hasTouch: getRandomArrayElement([true, false]),
      isLandscape: false,
      isMobile: false,
    },
    userAgentDetails: UAParser.parse(UA.toString()),
    isRegular: true,
  };
};

export const staticDevices = (): Device[] =>
  [
    {
      user_agent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      user_agent_data: {
        vendor: "Google Inc.",
        brands: [
          { brand: "Google Chrome", version: "91" },
          { brand: "Chromium", version: "91" },
          { brand: "Not-A.Brand", version: "24" },
        ],
        mobile: false,
        platform: "Windows",
        platformVersion: "10.0",
        architecture: "x64",
        bitness: 64,
        uaFullVersion: "91.0.4472.124",
        fullVersionList: [
          { brand: "Google Chrome", version: "91.0.4472.124" },
          { brand: "Chromium", version: "91.0.4472.124" },
          { brand: "Not-A.Brand", version: "24.0.0.0" },
        ],
      },
      webgl_params: {
        vendor: "Google Inc.",
        renderer: "ANGLE (Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0)",
        unmasked_vendor: "Intel Inc.",
        unmasked_renderer: "Intel(R) UHD Graphics 620",
        screen_width: 1920,
        screen_height: 1080,
        screen_depth: 24,
        screen_orientation_type: "portrait-primary",
        screen_orientation_angle: 0,
        viewport_width: 1920,
        viewport_height: 943,
        device_scale_factor: 1,
      },
      maxTouchPoints: 1,
    },
    {
      user_agent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/525.37 (KHTML, like Gecko) Chrome/92.0.4473.0 Safari/525.37",
      user_agent_data: {
        vendor: "Google Inc.",
        brands: [
          { brand: "Google Chrome", version: "92" },
          { brand: "Chromium", version: "92" },
          { brand: "Not-A.Brand", version: "24" },
        ],
        mobile: false,
        platform: "Linux x86_64",
        platformVersion: "Ubuntu 20.04 LTS (Focal Fossa)",
        architecture: "x64",
        bitness: 64,
        uaFullVersion: "92.0.4473.0",
        fullVersionList: [
          { brand: "Google Chrome", version: "92.0.4473.0" },
          { brand: "Chromium", version: "92.0.4473.0" },
          { brand: "Not-A.Brand", version: "24.0.0.0" },
        ],
      },
      webgl_params: {
        vendor: "Google Inc.",
        renderer: "ANGLE (AMD Radeon HD 8670D Direct3D11 vs_5_0 ps_5_0)",
        unmasked_vendor: "ATI Technologies Inc.",
        unmasked_renderer: "AMD Radeon HD 8670D",
        screen_width: 1366,
        screen_height: 768,
        screen_depth: 30,
        screen_orientation_type: "landscape-primary",
        screen_orientation_angle: 0,
        viewport_width: 1366,
        viewport_height: 678,
        device_scale_factor: 1,
      },
      maxTouchPoints: 1,
    },
    {
      user_agent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      user_agent_data: {
        vendor: "Google Inc.",
        brands: [
          { brand: "Google Chrome", version: "113" },
          { brand: "Chromium", version: "113" },
          { brand: "Not-A.Brand", version: "24" },
        ],
        mobile: false,
        platform: "Windows",
        platformVersion: "10.0",
        architecture: "x64",
        bitness: 64,
        uaFullVersion: "113.0.0.0",
        fullVersionList: [
          { brand: "Google Chrome", version: "113.0.0.0" },
          { brand: "Chromium", version: "113.0.0.0" },
          { brand: "Not-A.Brand", version: "24.0.0.0" },
        ],
      },
      webgl_params: {
        vendor: "Intel Inc.",
        renderer: "Intel(R) HD Graphics 620",
        unmasked_vendor: "Intel Inc.",
        unmasked_renderer: "Intel(R) HD Graphics 620",
        screen_width: 1366,
        screen_height: 768,
        screen_depth: 24,
        screen_orientation_type: "portrait-primary",
        screen_orientation_angle: 0,
        viewport_width: 1366,
        viewport_height: 678,
        device_scale_factor: 1,
      },
      maxTouchPoints: 1,
    },
    {
      user_agent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      user_agent_data: {
        vendor: "Google Inc.",
        brands: [
          { brand: "Google Chrome", version: "91" },
          { brand: "Chromium", version: "91" },
          { brand: "Not-A.Brand", version: "24" },
        ],
        mobile: false,
        platform: "macOS",
        platformVersion: "12.0.1",
        architecture: "x64",
        bitness: 64,
        uaFullVersion: "91.0.4472.124",
        fullVersionList: [
          { brand: "Google Chrome", version: "91.0.4472.124" },
          { brand: "Chromium", version: "91.0.4472.124" },
          { brand: "Not-A.Brand", version: "24.0.0.0" },
        ],
      },
      webgl_params: {
        vendor: "NVIDIA Corporation",
        renderer: "NVIDIA GeForce GT 750M OpenGL Engine",
        unmasked_vendor: "NVIDIA Corporation",
        unmasked_renderer: "NVIDIA GeForce GT 750M OpenGL Engine",
        screen_width: 2560,
        screen_height: 1600,
        screen_depth: 30,
        screen_orientation_type: "landscape-primary",
        screen_orientation_angle: 0,
        viewport_width: 2560,
        viewport_height: 1378,
        device_scale_factor: 2,
      },
      maxTouchPoints: 1,
    },
    {
      user_agent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.4.0.0 Safari/537.36",
      user_agent_data: {
        vendor: "Google Inc.",
        brands: [
          { brand: "Google Chrome", version: "112" },
          { brand: "Chromium", version: "112" },
          { brand: "Not-A.Brand", version: "24" },
        ],
        mobile: false,
        platform: "Linux x86_64",
        platformVersion: "Manjaro Linux 21.0.7",
        architecture: "x64",
        bitness: 64,
        uaFullVersion: "112.4.0.0",
        fullVersionList: [
          { brand: "Google Chrome", version: "112.4.0.0" },
          { brand: "Chromium", version: "112.4.0.0" },
          { brand: "Not-A.Brand", version: "24.0.0.0" },
        ],
      },
      webgl_params: {
        vendor: "ATI Technologies Inc.",
        renderer: "AMD Radeon HD 8670D",
        unmasked_vendor: "ATI Technologies Inc.",
        unmasked_renderer: "AMD Radeon HD 8670D",
        screen_width: 1920,
        screen_height: 1080,
        screen_depth: 24,
        screen_orientation_type: "landscape-primary",
        screen_orientation_angle: 0,
        viewport_width: 1920,
        viewport_height: 943,
        device_scale_factor: 1,
      },
      maxTouchPoints: 1,
    },
    {
      user_agent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      user_agent_data: {
        vendor: "Google Inc.",
        brands: [
          { brand: "Google Chrome", version: "113" },
          { brand: "Chromium", version: "113" },
          { brand: "Not-A.Brand", version: "24" },
        ],
        mobile: false,
        platform: "Windows",
        platformVersion: "10.0",
        architecture: "x64",
        bitness: 64,
        uaFullVersion: "113.0.0.0",
        fullVersionList: [
          { brand: "Google Chrome", version: "113.0.0.0" },
          { brand: "Chromium", version: "113.0.0.0" },
          { brand: "Not-A.Brand", version: "24.0.0.0" },
        ],
      },
      webgl_params: {
        vendor: "Google Inc.",
        renderer: "ANGLE (NVIDIA GeForce GT 640M Direct3D11 vs_5_0 ps_5_0)",
        unmasked_vendor: "NVIDIA Corporation",
        unmasked_renderer: "NVIDIA GeForce GT 640M",
        screen_width: 1920,
        screen_height: 1080,
        screen_depth: 30,
        screen_orientation_type: "portrait-primary",
        screen_orientation_angle: 0,
        viewport_width: 1920,
        viewport_height: 943,
        device_scale_factor: 1,
      },
      maxTouchPoints: 1,
    },
    {
      user_agent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      user_agent_data: {
        vendor: "Google Inc.",
        brands: [
          { brand: "Google Chrome", version: "113" },
          { brand: "Chromium", version: "113" },
          { brand: "Not-A.Brand", version: "24" },
        ],
        mobile: false,
        platform: "Windows",
        platformVersion: "10.0",
        architecture: "x64",
        bitness: 64,
        uaFullVersion: "113.0.0.0",
        fullVersionList: [
          { brand: "Google Chrome", version: "113.0.0.0" },
          { brand: "Chromium", version: "113.0.0.0" },
          { brand: "Not-A.Brand", version: "24.0.0.0" },
        ],
      },
      webgl_params: {
        vendor: "Google Inc.",
        renderer: "ANGLE (NVIDIA GeForce GT 640M Direct3D11 vs_5_0 ps_5_0)",
        unmasked_vendor: "NVIDIA Corporation",
        unmasked_renderer: "NVIDIA GeForce GT 640M",
        screen_width: 1920,
        screen_height: 1080,
        screen_depth: 24,
        screen_orientation_type: "portrait-primary",
        screen_orientation_angle: 0,
        viewport_width: 1920,
        viewport_height: 943,
        device_scale_factor: 1,
      },
      maxTouchPoints: 1,
    },
    {
      user_agent:
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Mobile Safari/537.36",
      user_agent_data: {
        vendor: "Google Inc.",
        brands: [
          { brand: "Google Chrome", version: "113" },
          { brand: "Chromium", version: "113" },
          { brand: "Not-A.Brand", version: "24" },
        ],
        mobile: true,
        platform: "Linux armv81",
        platformVersion: "13.0.0",
        architecture: "empty",
        bitness: "empty",
        model: "V2130",
        uaFullVersion: "113.0.0.0",
        fullVersionList: [
          { brand: "Google Chrome", version: "113.0.0.0" },
          { brand: "Chromium", version: "113.0.0.0" },
          { brand: "Not-A.Brand", version: "24.0.0.0" },
        ],
      },
      webgl_params: {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmasked_vendor: "Google Inc. (ARM)",
        unmasked_renderer: "ANGLE (ARM, Mali-G68 MC4, OpenGL ES 3.2)",
        screen_width: 393,
        screen_height: 873,
        screen_depth: 24,
        screen_orientation_type: "portrait-primary",
        screen_orientation_angle: 0,
        viewport_width: 393,
        viewport_height: 761,
        device_scale_factor: 2.75,
      },
      maxTouchPoints: 5,
      hasTouch: true,
      isLandscape: false,
      isMobile: true,
    },
    {
      user_agent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1",
      user_agent_data: {
        vendor: "Apple Computer, Inc.",
        platform: "iPhone",
      },
      webgl_params: {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmasked_vendor: "Apple Inc.",
        unmasked_renderer: "Apple GPU",
        screen_width: 375,
        screen_height: 812,
        screen_depth: 32,
        screen_orientation_type: undefined,
        screen_orientation_angle: undefined,
        viewport_width: 375,
        viewport_height: 635,
        device_scale_factor: 3,
      },
      maxTouchPoints: 5,
      hasTouch: true,
      isLandscape: false,
      isMobile: true,
    },
    {
      platform: "MacIntel",
      user_agent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      user_agent_data: {
        vendor: "Google Inc.",
        brands: [
          { brand: "Google Chrome", version: "113" },
          { brand: "Chromium", version: "113" },
          { brand: "Not-A.Brand", version: "24" },
        ],
        mobile: false,
        platform: "macOS",
        platformVersion: "13.3.1",
        architecture: "x86",
        bitness: 64,
        uaFullVersion: "113.0.0.0",
        fullVersionList: [
          { brand: "Google Chrome", version: "113.0.0.0" },
          { brand: "Chromium", version: "113.0.0.0" },
          { brand: "Not-A.Brand", version: "24.0.0.0" },
        ],
      },
      webgl_params: {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmasked_vendor: "Google Inc. (Intel Inc.)",
        unmasked_renderer:
          "ANGLE (Intel Inc., Intel(R) UHD Graphics 630, OpenGL 4.1)",
        screen_width: 1792,
        screen_height: 1120,
        screen_depth: 30,
        screen_orientation_type: "landscape-primary",
        screen_orientation_angle: 0,
        viewport_width: 1792,
        viewport_height: 1009,
        device_scale_factor: 2,
      },
      maxTouchPoints: 0,
      hasTouch: false,
    },
  ].map((device) => ({
    platform: device.platform,
    userAgent: device.user_agent,
    screen: {
      width: device.webgl_params.screen_width,
      height: device.webgl_params.screen_height,
      depth: device.webgl_params.screen_depth ?? 24,
      orientation: {
        type: device.webgl_params.screen_orientation_type,
        angle: device.webgl_params.screen_orientation_angle,
      },
    },
    viewport: {
      width: device.webgl_params.viewport_width,
      height: device.webgl_params.viewport_height,
      deviceScaleFactor: device.webgl_params.device_scale_factor,
      hasTouch: device.hasTouch ?? getRandomArrayElement([true, false]),
      isLandscape: device.isLandscape ?? false,
      isMobile: device.isMobile ?? false,
    },
    webGL: {
      vendor: device.webgl_params.vendor,
      renderer: device.webgl_params.renderer,
      unmaskedVendor: device.webgl_params.unmasked_vendor,
      unmaskedRenderer: device.webgl_params.unmasked_renderer,
    },
    userAgentDetails: UAParser.parse(device.user_agent),
    userAgentData: device.user_agent_data,
    maxTouchPoints: device.maxTouchPoints,
    isRegular: true,
  }));
