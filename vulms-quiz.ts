import puppeteer from "puppeteer";
import path from "path";
import inquirer from "inquirer";

require("dotenv").config();

export const Argv = require("minimist")(process.argv.slice(2));

const FirefoxUserAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0";

const RawCookieString = process.env.VULMS_COOKIES;

const TargetUrl = "https://vulms.vu.edu.pk/Quiz/QuizList.aspx";
const CookiesObject = RawCookieString?.split(";").map((cookie) => {
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
  const { DefaultNavigationTimeout } = await import("./constants");

  const Browser = await puppeteer.launch({
    headless:
      Argv.headless ?? Argv.HEADLESS ?? Argv.Headless ?? true ? "new" : false,
    devtools: Argv.devtools ?? Argv.DevTools ?? Argv.DEV_TOOLS ?? false,
    userDataDir: path.join(process.cwd(), "./puppeteer/data/vulms/"),
  });

  const Page = await Browser.newPage();

  await Page.setUserAgent(FirefoxUserAgent);

  await Page.goto(TargetUrl, { timeout: DefaultNavigationTimeout });

  if (CookiesObject) {
    await Page.setCookie(...CookiesObject);

    await Page.goto(TargetUrl, { timeout: DefaultNavigationTimeout });
  }

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
