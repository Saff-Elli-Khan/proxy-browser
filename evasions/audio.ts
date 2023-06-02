import { Page } from "puppeteer";

export default (page: Page) =>
  page.evaluateOnNewDocument(() => {
    const AudioOffset = Math.random() * 1e-5;

    var audioSpoof = {
      currChannelData: null,

      channelData: function (obj, name, consistency) {
        var func = obj[name];

        Object.defineProperty(obj, name, {
          value: function () {
            var result = func.apply(this, arguments);

            if (audioSpoof.currChannelData !== result) {
              audioSpoof.currChannelData = result;

              // result.length usually = 44100
              for (let i = 0; i < result.length; i += consistency) {
                let index = Math.floor(i);
                result[index] = result[index] + AudioOffset;
              }
            }
            return result;
          },
        });
      },
    };

    if (window.AudioBuffer) {
      let frequencyAnalyser = function (obj, name) {
        var func = obj[name];

        Object.defineProperty(obj, name, {
          value: function () {
            func.apply(this, arguments);

            for (let i = 0; i < arguments[0].length; i++) {
              let index = Math.floor(i);
              arguments[0][index] = arguments[0][index] + AudioOffset;
            }

            return func.apply(this, arguments);
          },
        });
      };

      frequencyAnalyser(window.AudioBuffer.prototype, "copyFromChannel");
    }

    // Modify an AudioCtx function's argument[0]
    let frequencyData = function (obj, name, frequencyFunction, consistency) {
      var func = obj[name];

      Object.defineProperty(obj, name, {
        value: function () {
          var result = func.apply(this, arguments);

          var frequencyData = result.__proto__[frequencyFunction];
          Object.defineProperty(result.__proto__, frequencyFunction, {
            value: function () {
              var frequencyResult = frequencyData.apply(this, arguments);

              for (let i = 0; i < arguments[0].length; i += consistency) {
                let index = Math.floor(i);
                arguments[0][index] = arguments[0][index] + AudioOffset;
              }
              return frequencyResult;
            },
          });
          return result;
        },
      });
    };

    [
      "webkitAudioContext",
      "AudioContext",
      "webkitOfflineAudioContext",
      "OfflineAudioContext",
    ].forEach(function (ctx) {
      if (!window[ctx]) return;

      frequencyData(
        window[ctx].prototype.__proto__,
        "createAnalyser",
        "getFloatFrequencyData",
        100
      );
      frequencyData(
        window[ctx].prototype.__proto__,
        "createAnalyser",
        "getFloatTimeDomainData",
        100
      );
    });
  });
