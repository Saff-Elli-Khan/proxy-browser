import { Page } from "puppeteer";

export default (page: Page) =>
  page.evaluateOnNewDocument(() => {
    if (!window.navigator) return;

    function doUpdateProp(obj, prop, newVal) {
      let props = Object.getOwnPropertyDescriptor(obj, prop) || {
        configurable: true,
      };

      if (!props["configurable"]) return;

      props["value"] = newVal;
      Object.defineProperty(obj, prop, props);

      return props;
    }

    let randArr = function (arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    };

    ["hardwareConcurrency", "deviceMemory"].forEach(function (hw) {
      doUpdateProp(
        window.navigator,
        hw,
        randArr(
          [2, 4, 8, 16, 32].filter((cores) => cores <= window.navigator[hw])
        )
      );
    });

    doUpdateProp(window.navigator, "getVRDisplays", undefined);
    doUpdateProp(window.navigator, "activeVRDisplays", undefined);
    doUpdateProp(window.navigator, "getGamepads", undefined);
  });
