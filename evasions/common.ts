import { Page } from "puppeteer";
import { Device } from "../useragent";

export type Options = {
  googleAnalytics?: boolean;
  piwik?: boolean;
  segment?: boolean;
  countly?: boolean;
  fbevents?: boolean;
  device?: Device;
};

export default (page: Page, options: Options) =>
  page.evaluateOnNewDocument((options) => {
    function doUpdateSubProp(obj, prop, updProp, newVal) {
      let props = Object.getOwnPropertyDescriptor(obj, prop) || {
        configurable: true,
      };

      if (!props["configurable"]) return;

      props[updProp] = newVal;
      Object.defineProperty(obj, prop, props);

      return props;
    }

    let NavigatorUAData = function () {
      this.brands = options.device?.userAgentData?.brands;
      this.mobile = options.device?.userAgentData?.mobile;
      this.platform = options.device?.userAgentData?.platform;
      this.platformVersion = options.device?.userAgentData?.platformVersion;
      this.architecture = options.device?.userAgentData?.architecture;
      this.bitness = options.device?.userAgentData?.bitness;
      this.uaFullVersion = options.device?.userAgentData?.uaFullVersion;
      this.fullVersionList = options.device?.userAgentData?.fullVersionList;
    };

    doUpdateSubProp(window.navigator, "userAgentData", "get", function () {
      return options.device?.viewport.isMobile
        ? undefined
        : new NavigatorUAData();
    });

    doUpdateSubProp(window.navigator, "vendor", "get", function () {
      return options.device?.userAgentData?.vendor;
    });

    doUpdateSubProp(window.navigator, "platform", "get", function () {
      return (
        options.device?.platform ?? options.device?.userAgentData?.platform
      );
    });

    doUpdateSubProp(window.navigator, "maxTouchPoints", "get", function () {
      return options.device?.maxTouchPoints;
    });

    let ScreenOrientation = function () {
      this.type = options.device?.screen?.orientation?.type;
      this.angle = options.device?.screen?.orientation?.angle;
      this.onchange = null;
    };

    let Screen = function () {
      this.availWidth =
        options.device?.viewport?.width ?? window.screen.availWidth;
      this.availHeight =
        options.device?.viewport?.height ?? window.screen.availHeight;
      this.availLeft = 0;
      this.availTop = 0;
      this.colorDepth =
        options.device?.screen?.depth ?? window.screen.colorDepth;
      this.pixelDepth =
        options.device?.screen?.depth ?? window.screen.pixelDepth;
      this.width = options.device?.screen?.width ?? window.screen.width;
      this.height = options.device?.screen?.height ?? window.screen.height;
      this.isExtended = false;
      this.onchange = null;
      this.orientation = new ScreenOrientation();
    };

    window.screen = new Screen();

    const TrackBlocker = function (data) {
      console.log("Blocked tracking attempt, data:");
      console.log(data);
    };

    function getNewProps(v) {
      return {
        writable: true,
        configurable: true,
        value: v,
      };
    }

    // Block Google Analytics
    if (options.googleAnalytics !== false)
      Object.defineProperties(window, {
        _gaq: getNewProps(false),
        ga: getNewProps({}),
        GoogleAnalyticsObject: getNewProps(false),
      });

    // Block Piwik
    if (options.piwik !== false)
      Object.defineProperties(window, {
        _paq: getNewProps({
          push: TrackBlocker,
        }),
        Matomo: getNewProps({
          initialized: true,
          addPlugin: TrackBlocker,
          getAsyncTrackers: function () {
            return [];
          },
          trigger: function () {},
        }),
        Piwik: getNewProps({
          initialized: true,
          addPlugin: TrackBlocker,
          getAsyncTrackers: function () {
            return [];
          },
          trigger: function () {},
        }),
      });

    // Block Segment
    if (options.segment !== false)
      Object.defineProperties(window, {
        analytics: getNewProps({
          load: TrackBlocker,
          page: TrackBlocker,
          push: TrackBlocker,
          track: TrackBlocker,
          methods: [],
          initialize: true,
          invoked: true,
          factory: function () {},
        }),
      });

    // Block Countly
    if (options.countly !== false)
      Object.defineProperties(window, {
        Countly: getNewProps({
          q: {
            push: TrackBlocker,
          },
          log_error: TrackBlocker,
          url: "",
          app_key: "",
          debug: false,
          device_id: Math.random().toString(),
          ignore_visitor: true,
          require_consent: false,
        }),
      });

    // Block Fbevents
    if (options.fbevents !== false)
      Object.defineProperties(window, {
        fbq: getNewProps(function () {}),
      });
  }, options);
