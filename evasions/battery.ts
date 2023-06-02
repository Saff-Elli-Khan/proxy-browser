import { Page } from "puppeteer";

export default (page: Page) =>
  page.evaluateOnNewDocument(() => {
    // Random 2 dp value
    const BatteryLevel = Math.floor(Math.random() * 100) / 100;

    function doUpdateProp(obj, prop, newVal) {
      let props = Object.getOwnPropertyDescriptor(obj, prop) || {
        configurable: true,
      };

      if (!props["configurable"]) return;

      props["value"] = newVal;
      Object.defineProperty(obj, prop, props);

      return props;
    }

    let BatteryPromise = new Promise(function (resolve) {
      let BatteryManager = function () {
        this.charging = true;
        this.chargingTime = Infinity;
        this.dischargingTime = Infinity;
        this.level = BatteryLevel;

        this.onchargingchange = null;
        this.onchargingtimechange = null;
        this.ondischargingtimechange = null;
        this.onlevelchange = null;
      };

      resolve(new BatteryManager());
    });

    doUpdateProp(window.navigator, "getBattery", function () {
      return BatteryPromise;
    });

    doUpdateProp(
      // @ts-ignore
      window.navigator.getBattery,
      "toString",
      "function getBattery() { [native code] }"
    );
  });
