import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

export const Argv = require("minimist")(process.argv.slice(2));

const ExpectedIpCount = Argv.limit ?? Argv.Limit ?? Argv.LIMIT ?? 50;
const RawCookieString =
  "notice=1; notice_time=1683538037; 247c84935371dbf1192a48bbc1fdcdc8=d42d70fc8c5868e445d775d21d214484cb1d4e62a%3A4%3A%7Bi%3A0%3Bs%3A6%3A%22265611%22%3Bi%3A1%3Bs%3A12%3A%22saffellikhan%22%3Bi%3A2%3Bi%3A2592000%3Bi%3A3%3Ba%3A0%3A%7B%7D%7D; loginCookie=jEHTFzLZKC; PHPSESSID=3n54gdoo3atovcj64sbin2106n";

const TargetUrl = "https://dichvusocks.us/sockslist";
const CookiesObject = RawCookieString.split(";").map((cookie) => {
  const Kv = cookie.trim().split("=");
  return {
    name: Kv[0],
    value: Kv[1],
  };
});

const Ips: string[] = [];

(async () => {
  try {
    const Browser = await puppeteer.launch({
      headless:
        Argv.headless ?? Argv.HEADLESS ?? Argv.Headless ?? true ? "new" : false,
      devtools: Argv.devtools ?? Argv.DevTools ?? Argv.DEV_TOOLS ?? false,
    });

    const Page = await Browser.newPage();

    await Page.goto(TargetUrl);

    await Page.setCookie(...CookiesObject);

    await Page.goto(TargetUrl);

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
        if (Ips.length < ExpectedIpCount) {
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
            Ips.push(Ip);

          console.info("Activity::", "Got Ip:", Ip);

          if (Ip.includes("limited") || Ip.includes("buy socks")) {
            Exit = true;
            break;
          }
        }

      if (Exit) break;

      pageNumber++;

      if (pageNumber > PagesCount) break;
    } while (Ips.length < ExpectedIpCount);

    await Browser.close();
  } catch (error) {
    console.error(error);
  }

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

  fs.writeFileSync(
    IpListPath,
    Array.from(new Set([...ExistingIps, ...Ips])).join("\n")
  );
})();
