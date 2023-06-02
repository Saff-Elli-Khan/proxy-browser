import { Page } from "puppeteer";
import { Device } from "../useragent";

export type Options = {
  device: Device;
};

export default (page: Page, options?: Options) =>
  page.evaluateOnNewDocument((options) => {
    var randNum = function (min, max) {
      return Math.floor(Math.random() * (max - min) + min);
    };

    var randArr = function (arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    };

    const WebGLOffset = Math.random();

    function safeOverwrite(obj, prop, newVal) {
      let props = Object.getOwnPropertyDescriptor(obj, prop);
      if (props) props["value"] = newVal;
      return props;
    }

    const CurrentCanvas = document.createElement("canvas");
    const CurrentWebGL = CurrentCanvas.getContext("webgl");

    if (CurrentWebGL) {
      let changeMap = {
        3379: randArr(
          [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072].filter(
            (v) => v <= CurrentWebGL.getParameter(CurrentWebGL.MAX_TEXTURE_SIZE)
          )
        ),
        3386: Int32Array.from(
          randArr([
            [16384, 16384],
            [32768, 32768],
            [4096, 4096],
            [8192, 8192],
            [16384, 8192],
            [8192, 16384],
            [4096, 2048],
            [2048, 4096],
          ])
        ),
        3410: 8,
        3411: 8,
        3412: 8,
        3413: 8,
        3414: 24,
        3415: 0,
        6408: randNum(6400, 6420),
        34024: randArr(
          [
            2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288,
            1048576,
          ].filter(
            (v) =>
              v <= CurrentWebGL.getParameter(CurrentWebGL.MAX_RENDERBUFFER_SIZE)
          )
        ),
        30476: randArr(
          [
            2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288,
            1048576,
          ].filter(
            (v) =>
              v <=
              CurrentWebGL.getParameter(CurrentWebGL.MAX_CUBE_MAP_TEXTURE_SIZE)
          )
        ),
        34921: randArr(
          [16, 32, 64, 128, 256].filter(
            (v) =>
              v <= CurrentWebGL.getParameter(CurrentWebGL.MAX_VERTEX_ATTRIBS)
          )
        ),
        34930: randArr(
          [8, 16, 32, 64, 128, 256].filter(
            (v) =>
              v <=
              CurrentWebGL.getParameter(CurrentWebGL.MAX_TEXTURE_IMAGE_UNITS)
          )
        ),
        35660: randArr(
          [4, 8, 16, 32, 64, 128, 256].filter(
            (v) =>
              v <=
              CurrentWebGL.getParameter(
                CurrentWebGL.MAX_VERTEX_TEXTURE_IMAGE_UNITS
              )
          )
        ),
        35661: randArr([128, 192, 256]),
        36347: randArr(
          [128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768].filter(
            (v) =>
              v <=
              CurrentWebGL.getParameter(CurrentWebGL.MAX_VERTEX_UNIFORM_VECTORS)
          )
        ),
        36349: Math.pow(2, randNum(9, 12)),
        7936:
          options?.device?.webGL?.vendor ??
          CurrentWebGL.getParameter(CurrentWebGL.VENDOR),
        7937:
          options?.device?.webGL?.renderer ??
          CurrentWebGL.getParameter(CurrentWebGL.RENDERER),
        37445:
          options?.device?.webGL?.unmaskedVendor ??
          CurrentWebGL.getParameter(37445),
        37446:
          options?.device?.webGL?.unmaskedRenderer ??
          CurrentWebGL.getParameter(37446),
      };

      ["WebGLRenderingContext", "WebGL2RenderingContext"].forEach(function (
        ctx
      ) {
        if (!window[ctx]) return;

        // Modify getParameter
        let oldParam = window[ctx].prototype.getParameter;

        Object.defineProperty(
          window[ctx].prototype,
          "getParameter",
          // @ts-ignore
          safeOverwrite(
            window[ctx].prototype,
            "getParameter",
            function (param) {
              if (changeMap[param]) return changeMap[param];
              return oldParam.apply(this, arguments);
            }
          )
        );

        // Modify bufferData (this updates the image hash)
        let oldBuffer = window[ctx].prototype.bufferData;

        Object.defineProperty(
          window[ctx].prototype,
          "bufferData",
          // @ts-ignore
          safeOverwrite(window[ctx].prototype, "bufferData", function () {
            for (let i = 0; i < arguments[1].length; i++)
              arguments[1][i] += WebGLOffset * 1e-3;
            return oldBuffer.apply(this, arguments);
          })
        );
      });
    }
  }, options);
