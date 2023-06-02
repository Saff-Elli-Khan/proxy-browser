import { Page } from "puppeteer";

export default (page: Page) =>
  page.evaluateOnNewDocument(() => {
    const toBlob = HTMLCanvasElement.prototype.toBlob;

    const toDataURL = HTMLCanvasElement.prototype.toDataURL;

    const getImageData = CanvasRenderingContext2D.prototype.getImageData;

    var noisify = function (canvas, context) {
      const shift = {
        r: Math.floor(Math.random() * 10) - 5,
        g: Math.floor(Math.random() * 10) - 5,
        b: Math.floor(Math.random() * 10) - 5,
        a: Math.floor(Math.random() * 10) - 5,
      };

      const width = canvas.width,
        height = canvas.height;
      const imageData = getImageData.apply(context, [0, 0, width, height]);
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          const n = i * (width * 4) + j * 4;
          imageData.data[n + 0] = imageData.data[n + 0] + shift.r;
          imageData.data[n + 1] = imageData.data[n + 1] + shift.g;
          imageData.data[n + 2] = imageData.data[n + 2] + shift.b;
          imageData.data[n + 3] = imageData.data[n + 3] + shift.a;
        }
      }

      window.top?.postMessage("canvas-fingerprint-defender-alert", "*");
      context.putImageData(imageData, 0, 0);
    };

    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      value: function () {
        noisify(this, this.getContext("2d"));
        return toBlob.apply(this, arguments);
      },
    });

    Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
      value: function () {
        noisify(this, this.getContext("2d"));
        return toDataURL.apply(this, arguments);
      },
    });

    Object.defineProperty(CanvasRenderingContext2D.prototype, "getImageData", {
      value: function () {
        noisify(this.canvas, this);
        return getImageData.apply(this, arguments);
      },
    });

    if (document.documentElement)
      document.documentElement.dataset.cbscriptallow = "1";
  });
