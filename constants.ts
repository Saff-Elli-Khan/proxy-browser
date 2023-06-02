export const Argv = require("minimist")(process.argv.slice(2));

export const DefaultNavigationTimeout = parseInt(
  Argv.nto ??
    Argv.navigationTimout ??
    Argv.NavigationTimeout ??
    Argv.NAVIGATION_TIMEOUT ??
    "120000"
);

export const RefererList: string[] | undefined = (
  Argv.referer ??
  Argv.Referer ??
  Argv.REFERER
)?.split(/\s*,\s*/g);
