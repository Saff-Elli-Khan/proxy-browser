import { Page } from "puppeteer";

export default (page: Page) =>
  page.evaluateOnNewDocument(() => {
    // @ts-ignore
    if (!window.navigator || !window.NetworkInformation) return;

    function doUpdateProp(obj, prop, newVal) {
      let props = Object.getOwnPropertyDescriptor(obj, prop) || {
        configurable: true,
      };

      if (!props["configurable"]) {
        //console.warn("Issue with property not being able to be configured.");
        return;
      }

      props["value"] = newVal;
      Object.defineProperty(obj, prop, props);

      return props;
    }

    var randNum = function (max) {
      return Math.floor(Math.random() * max);
    };

    var randArr = function (arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    };

    let NetworkInformation = function () {
      this.downlink = randNum(10);
      this.downlinkMax = Infinity;
      this.effectiveType = randArr(["4g", "3g", "2g"]);
      this.rtt = randArr([50, 75, 100, 125, 150]);
      this.saveData = false;
      this.type = randArr(["wifi", "ethernet", "other"]);

      this.onchange = null;
      this.ontypechange = null;

      // @ts-ignore
      this.__proto__ = window.NetworkInformation;
    };

    let fakeNet = new NetworkInformation();

    fakeNet.addEventListener = function () {};

    doUpdateProp(window.navigator, "connection", fakeNet);
  });
