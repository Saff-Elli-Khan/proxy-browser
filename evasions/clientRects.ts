import { Page } from "puppeteer";

export default (page: Page) =>
  page.evaluateOnNewDocument(() => {
    function doUpdateProp(obj, prop, newVal) {
      let props = Object.getOwnPropertyDescriptor(obj, prop) || {
        configurable: true,
      };

      if (!props["configurable"]) return;

      props["value"] = newVal;
      Object.defineProperty(obj, prop, props);

      return props;
    }

    // Generate offset
    let RectsOffset = Math.floor(Math.random() * 100) / 100;

    function updatedRect(old, round, overwrite) {
      function genOffset(round, val) {
        return val + (round ? Math.round(RectsOffset) : RectsOffset);
      }

      let temp = overwrite === true ? old : new DOMRect();

      temp.top = genOffset(round, old.top);
      temp.right = genOffset(round, old.right);
      temp.bottom = genOffset(round, old.bottom);
      temp.left = genOffset(round, old.left);
      temp.width = genOffset(round, old.width);
      temp.height = genOffset(round, old.height);
      temp.x = genOffset(round, old.x);
      temp.y = genOffset(round, old.y);

      return temp;
    }

    function getClientRectsProtection(el) {
      if (window.location.host === "docs.google.com") return;

      let clientRects = window[el].prototype.getClientRects;
      doUpdateProp(window[el].prototype, "getClientRects", function () {
        let rects = clientRects.apply(this, arguments);
        let krect = Object.keys(rects);

        let DOMRectList = function () {};
        let list = new DOMRectList();
        list.length = krect.length;
        for (let i = 0; i < list.length; i++) {
          if (krect[i] === "length") continue;
          list[i] = updatedRect(rects[krect[i]], false, false);
        }

        return list;
      });

      doUpdateProp(
        window[el].prototype.getClientRects,
        "toString",
        function () {
          return "getClientRects() { [native code] }";
        }
      );
    }
    function getBoundingClientRectsProtection(el) {
      let boundingRects = window[el].prototype.getBoundingClientRect;
      doUpdateProp(window[el].prototype, "getBoundingClientRect", function () {
        let rect = boundingRects.apply(this, arguments);
        if (this === undefined || this === null) return rect;

        return updatedRect(rect, true, true);
      });

      doUpdateProp(
        window[el].prototype.getBoundingClientRect,
        "toString",
        function () {
          return "getBoundingClientRect() { [native code] }";
        }
      );
    }

    ["Element", "Range"].forEach(function (el) {
      // Check for broken frames
      if (window[el] === undefined) return;

      // getClientRects
      getClientRectsProtection(el);

      // getBoundingClientRect
      getBoundingClientRectsProtection(el);
    });
  });
