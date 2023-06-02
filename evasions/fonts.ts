import { Page } from "puppeteer";

export default (page: Page) =>
  page.evaluateOnNewDocument(() => {
    const FontOffset = Math.random();

    let randArr = function (arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    };

    function doUpdateProp(obj, prop, updProp, newVal) {
      let props = Object.getOwnPropertyDescriptor(obj, prop) || {
        configurable: true,
      };

      if (!props["configurable"]) return;

      props[updProp] = newVal;
      Object.defineProperty(obj, prop, props);

      return props;
    }

    if (window.CanvasRenderingContext2D) {
      let measText = window.CanvasRenderingContext2D.prototype.measureText;

      doUpdateProp(
        window.CanvasRenderingContext2D.prototype,
        "measureText",
        "value",
        function () {
          let result = measText.apply(this, arguments);

          let TextMetrics = function () {
            this.__proto__ = window.TextMetrics;
          };

          let fakeResult = new TextMetrics();

          for (let b in result) {
            fakeResult[b] = result[b];
          }

          fakeResult.width = result.width + FontOffset;

          return fakeResult;
        }
      );
    }

    if (window.Element) {
      [
        ["offsetHeight", "height"],
        ["offsetWidth", "width"],
      ].forEach(function (meas) {
        doUpdateProp(HTMLElement.prototype, meas[0], "get", function () {
          return (
            (this.getBoundingClientRect()[meas[1]] || 0) +
            Math.floor(FontOffset * 100) / 10
          );
        });
      });
    }

    if (window.Node) {
      let checkFonts = function (fontStr) {
        let fonts = fontStr.split(",");

        if (fonts.length > 1) {
          return randArr(fonts);
        }

        return fonts;
      };

      let originalCssFunc = window.CSSStyleDeclaration.prototype.setProperty;
      let modifyCssFonts = function () {
        if (arguments[0].toLowerCase() !== "font-family")
          return originalCssFunc.apply(this, arguments);

        let currentFont = checkFonts(this.fontFamily);

        return originalCssFunc.call(this, "font-family", currentFont);
      };

      // A recursive function to help us modify elements
      let modifyChildren = function (el) {
        if (!el) return;

        // If element has font-family set, change it
        if (el.style && el.style.fontFamily)
          modifyCssFonts.call(el.style, "font-family", el.style.fontFamily);

        // If an element has children, check them for font-family
        if (el.childNodes) el.childNodes.forEach(modifyChildren);

        return el;
      };

      let originalAppendChild = window.Node.prototype.appendChild;
      doUpdateProp(window.Node.prototype, "appendChild", "value", function () {
        modifyChildren(arguments[0]);
        return originalAppendChild.apply(this, arguments);
      });
    }
  });
