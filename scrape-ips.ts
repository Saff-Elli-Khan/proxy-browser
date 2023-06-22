import puppeteer, { Browser } from "puppeteer";
import path from "path";
import fs from "fs";

require("dotenv").config();

const RawCookieString = process.env.DICHVUSOCKS_COOKIES;

const TargetUrl = "https://dichvusocks.us/sockslist";
const CookiesObject = RawCookieString?.split(";").map((cookie) => {
  const Kv = cookie.trim().split("=");
  return {
    name: Kv[0],
    value: Kv[1],
  };
});

export const scarpeIps = async (options: {
  ipcount: number;
  ips: string[];
  argv: Record<string, any>;
}): Promise<string[]> => {
  let Browser: Browser | undefined;

  try {
    Browser = await puppeteer.launch({
      headless:
        options.argv.headless ??
        options.argv.HEADLESS ??
        options.argv.Headless ??
        true
          ? "new"
          : false,
      devtools:
        options.argv.devtools ??
        options.argv.DevTools ??
        options.argv.DEV_TOOLS ??
        false,
      userDataDir: path.join(process.cwd(), "./puppeteer/data/scrapper/"),
    });

    const Page = await Browser.newPage();

    await Page.goto(TargetUrl);

    if (CookiesObject) {
      await Page.setCookie(...CookiesObject);
      await Page.goto(TargetUrl);
    }

    if (new URL(Page.url()).pathname !== "/sockslist")
      throw new Error(`Login has been failed!`);

    console.info("Activity::", "Logged In!");

    let pageNumber = 1;

    do {
      await Page.waitForSelector("#search_YN");
      await Page.waitForSelector("#s_main");

      console.info("Activity::", "Evaluation Started!");

      const { pagesCount: PagesCount, ids: Ids } = await Page.evaluate(
        async (pageNumber) => {
          const SelectBlacklisted = document.getElementById(
            "search_YN"
          ) as HTMLSelectElement | null;

          if (SelectBlacklisted) SelectBlacklisted.value = "No";

          const View = document.getElementById("s_main");

          if (View) {
            const PagesCount = await new Promise<number>((res, rej) => {
              $.ajax({
                type: "POST",
                url: "/search&act=SearchAll&page=" + pageNumber,
                data: "country=All&region=All&city=All&yn=No&selectSpecialIP=select",
                success: async function (html) {
                  $("#s_main").html(html);

                  await new Promise((res) => {
                    let checkExist = setInterval(() => {
                      if ($("#s_main ul .uk-first-column span").length) {
                        res(0);
                        clearInterval(checkExist);
                      }
                    }, 100);
                  });

                  // 'page 1 of 127'
                  const PaginationText = (
                    View.querySelector<HTMLSpanElement>(
                      "ul .uk-first-column span"
                    )?.innerText ?? "page 0 of 0"
                  ).toLowerCase();

                  res(
                    parseInt(PaginationText.split("of").pop()?.trim() ?? "0")
                  );
                },
                error: function (error) {
                  rej(error);
                },
              });
            });

            const List = View.querySelectorAll<HTMLTableRowElement>(
              "div.uk-overflow-auto tbody tr"
            );

            return {
              pagesCount: PagesCount,
              ids: Array.from(List).map((item) =>
                parseInt((item.id ?? "0").toLowerCase().replace("socks_", ""))
              ),
            };
          } else return { pagesCount: 0, ids: [] };
        },
        pageNumber
      );

      console.info("Activity::", "Page Loaded:", pageNumber, "of", PagesCount);

      if (!PagesCount) break;

      let Exit = false;

      for (let id of Ids)
        if (options.ips.length < options.ipcount) {
          await new Promise((res) => setTimeout(res, 1000));

          const Ip = await Page.evaluate(async (id) => {
            await new Promise((res, rej) => {
              $.ajax({
                type: "GET",
                url: "/viewsocks&id=" + id,
                // @ts-ignore
                beforeSend: waitloadsocks(id),
                success: function (msg) {
                  eval(msg);
                  res(0);
                },
                error: function (error) {
                  var row = $("#ip_socks_" + id);
                  if (error.status.toString() == "529")
                    row.html("Too fast, please slowly.");
                  else row.html("Server Busy.");

                  rej(error);
                },
              });
            }).catch(console.error);

            await new Promise((res) => {
              let checkExist = setInterval(() => {
                if ($(`#socks_${id} td`).length) {
                  res(0);
                  clearInterval(checkExist);
                }
              }, 100);
            });

            return (
              document.querySelector<HTMLAnchorElement>(`#socks_${id} td`)
                ?.innerText ?? ""
            ).trim();
          }, id);

          if (
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/.test(
              Ip
            )
          )
            options.ips.push(`socks5://${Ip}`);

          console.info("Activity::", "Got Ip:", Ip);

          if (Ip.includes("limited") || Ip.includes("buy socks")) {
            Exit = true;
            break;
          }
        }

      if (Exit) break;

      pageNumber++;

      if (pageNumber > PagesCount) break;
    } while (options.ips.length < options.ipcount);
  } catch (error) {
    console.error(error);
  }

  await Browser?.close().catch(console.error);

  try {
    const IpListDirPath = path.join(process.cwd(), "./ips");

    if (!fs.existsSync(IpListDirPath)) fs.mkdirSync(IpListDirPath);

    const IpListPath = path.join(
      IpListDirPath,
      `./${new Date()
        .toLocaleDateString([], {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "-")}_ips.txt`
    );

    const ExistingIps = fs.existsSync(IpListPath)
      ? fs
          .readFileSync(IpListPath)
          .toString()
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((ip) => ip.trim())
      : [];

    const TotalIps = Array.from(new Set([...ExistingIps, ...options.ips]));

    fs.writeFileSync(IpListPath, TotalIps.join("\n"));

    return TotalIps;
  } catch (error) {
    console.error(error);
  }

  return [...options.ips];
};

if (require.main === module) {
  const Argv = require("minimist")(process.argv.slice(2));
  scarpeIps({
    ipcount: Argv.limit ?? Argv.Limit ?? Argv.LIMIT ?? 50,
    ips: [],
    argv: Argv,
  });
}
