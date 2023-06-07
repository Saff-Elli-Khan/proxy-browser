import puppeteer from "puppeteer";
import path from "path";
import inquirer from "inquirer";

import { DefaultNavigationTimeout } from "./constants";

export const Argv = require("minimist")(process.argv.slice(2));

const FirefoxUserAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0";

const RawCookieString =
  "_sid=0dcc3e97be1232010a9c12cc751eb233c04ef3f3266ab65fd8c7fb0f235f4324; _gid=GA1.3.1762653630.1686131138; _gat=1; ASP.NET_SessionId=nuyrwh2lq1qmjhbj4v0y41ez; _ga=GA1.1.357199455.1684305935; _ga_R2WPTZXM1P=GS1.1.1686157926.18.1.1686157955.0.0.0";

const ChatGPTAccessToken =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1UaEVOVUpHTkVNMVFURTRNMEZCTWpkQ05UZzVNRFUxUlRVd1FVSkRNRU13UmtGRVFrRXpSZyJ9.eyJodHRwczovL2FwaS5vcGVuYWkuY29tL3Byb2ZpbGUiOnsiZW1haWwiOiJzYWZmZWxsaWtoYW5AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWV9LCJodHRwczovL2FwaS5vcGVuYWkuY29tL2F1dGgiOnsidXNlcl9pZCI6InVzZXItTW8zU1RWQzQ3Q3c2YmFpdWNnS2s4eDNiIn0sImlzcyI6Imh0dHBzOi8vYXV0aDAub3BlbmFpLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExNTgzODEwMDgxNjE2MDUyNTM5MCIsImF1ZCI6WyJodHRwczovL2FwaS5vcGVuYWkuY29tL3YxIiwiaHR0cHM6Ly9vcGVuYWkub3BlbmFpLmF1dGgwYXBwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE2ODU4NzIzNzksImV4cCI6MTY4NzA4MTk3OSwiYXpwIjoiVGRKSWNiZTE2V29USHROOTVueXl3aDVFNHlPbzZJdEciLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIG1vZGVsLnJlYWQgbW9kZWwucmVxdWVzdCBvcmdhbml6YXRpb24ucmVhZCBvcmdhbml6YXRpb24ud3JpdGUifQ.O9pD_yyPOtxttja2AXR3f6azvlEN-scFjs0WOXQx5QTbbhy_NSD7ecCe0Zb8jZMx1WZRw3vDS_3qFD4AoDJ6E0EBCcC44RpbH6jOqbQWind2PvGlxRc2JsTivqfzKRCxaXcIqTTaT3fvelJQ77nE4C6zcWy2hg1U_x5SlacYKfFNcX8srbmKH5NmrFdsUsgoXXZCERjVCnaMZPaUimOyLQLc96LNmPMQSJPV0_agf11HMzpAr4Hux0p422BP1uJl9daBC70x5nlSef8Sv1bJodbMljBCai2PPzi-RbDwg0UqbXVbQ9IIZQOrsuuO_-ocX0icF8fKXPeckMT2ES1kfw";

const TargetUrl = "https://vulms.vu.edu.pk/Quiz/QuizList.aspx";
const CookiesObject = RawCookieString.split(";").map((cookie) => {
  const Kv = cookie.trim().split("=");
  return {
    name: Kv[0],
    value: Kv[1],
  };
});

const buildChatGPTPrompt = (question: string, choices: string[]) => `
Question: "${question}"

Choose the Best Option:
${choices.map((choice, i) => `${i + 1}. ${choice}`.trim()).join("\n")}

Note: Do not explain the answer. Just provide the option number without the option itself.
`;

(async () => {
  const Browser = await puppeteer.launch({
    headless:
      Argv.headless ?? Argv.HEADLESS ?? Argv.Headless ?? true ? "new" : false,
    devtools: Argv.devtools ?? Argv.DevTools ?? Argv.DEV_TOOLS ?? false,
    userDataDir: path.join(process.cwd(), "./puppeteer/data/vulms/"),
  });

  const Page = await Browser.newPage();

  await Page.setUserAgent(FirefoxUserAgent);

  await Page.goto(TargetUrl, { timeout: DefaultNavigationTimeout });

  await Page.setCookie(...CookiesObject);

  await Page.goto(TargetUrl, { timeout: DefaultNavigationTimeout });

  console.info("Activity::", "Logged In!");

  const TakeQuizLink = await Page.evaluate(
    () =>
      Array.from(document.querySelectorAll("a")).find(
        (link) => link.innerText === "Take Quiz"
      )?.href
  );

  if (typeof TakeQuizLink === "string") {
    await Page.goto(TakeQuizLink, { timeout: DefaultNavigationTimeout });

    await Promise.all([
      Page.waitForNavigation({ timeout: DefaultNavigationTimeout }).catch(
        console.error
      ),
      Page.click("#ibtnStartQuiz", { delay: 1000 }),
    ]);

    const startQuiz = async () => {
      const Quiz = await Page.evaluate(() => {
        const TextAreas = Array.from(document.querySelectorAll("textarea"));

        if (TextAreas.length > 7) {
          const QuestionTextAreas = TextAreas.filter(
            (textarea) => !textarea.id.includes("lblAnswer")
          );
          const ChoicesTextAreas = TextAreas.filter((textarea) =>
            textarea.id.includes("lblAnswer")
          );

          return {
            questions: QuestionTextAreas.map((t) => t.innerHTML.trim()).filter(
              Boolean
            ),
            choices: ChoicesTextAreas.map((textarea) => textarea.innerHTML),
          };
        } else {
          const Paragraphs = Array.from(document.querySelectorAll("p"));

          if (Paragraphs.length > 5) return null;

          return {
            questions: [Paragraphs.shift()?.innerHTML ?? ""].filter(Boolean),
            choices: Paragraphs.map((p) => p.innerHTML),
          };
        }
      });

      if (Quiz && Quiz.choices.length > 1) {
        let Question: string;

        if (Quiz.questions.length === 1) Question = Quiz.questions[0];
        else {
          const Prompt = await inquirer.prompt([
            {
              message: "Choose the valid Question:",
              type: "list",
              name: "question",
              choices: Quiz.questions.length
                ? Quiz.questions
                : ["Guess the correct answer!"],
            },
          ]);

          Question = Prompt.question;
        }

        const Prompt = buildChatGPTPrompt(Question, Quiz.choices);

        console.info(Prompt);

        await Page.waitForNavigation({ timeout: DefaultNavigationTimeout });
        await startQuiz();
      } else {
        console.warn("Unexpected question page layout!");

        const Answers = await inquirer.prompt([
          {
            message: "Do you want to continue manually (or close the browser)?",
            type: "confirm",
            name: "continue",
          },
        ]);

        if (Answers.continue) {
          await Page.waitForNavigation({ timeout: DefaultNavigationTimeout });
          await startQuiz();
        }
      }
    };

    await startQuiz();
  } else console.error("We didn't found the Take Quiz Link!");

  await Browser.close();
})();
