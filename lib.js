// =========================================================
// Imports
// =========================================================
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const log = console.log;
const DEBUG = true;
const DATE = new Date();
const YEAR = DATE.getFullYear();
const MONTH = DATE.getMonth() + 1;
const DAY = DATE.getDate();
const MILLISECONDS = Math.floor(Date.now() / 1000);
const PATH_TO_PACKAGE = path.join(__dirname, "packages", "lib");
const ROOT_PATH = path.join(__dirname);
const PACKAGE_JSON_FILE = fs.readFileSync(path.join(PATH_TO_PACKAGE, "package.json"), "utf-8");
const PACKAGE_JSON = JSON.parse(PACKAGE_JSON_FILE);
const PR_NUMBER = 1;
const COMMAND_BUILD = "npm run build";
const MESSAGE = `
## Changelog
Message to be added to the changelog
`;
const BUMP_KIND = "patch"; // major (x.0.0), minor (0.x.0), patch (0.0.X), beta (`0.0.0-beta20251231${PR_NUMBER}`)
const ACTION = "release-beta"; // release-it, release-beta, skip-release
// =========================================================
log(`[DEBUG:${DEBUG}]`);
log(`[PackagePublisher] - Applying "${BUMP_KIND}" on "${PACKAGE_JSON.name}" from "${PACKAGE_JSON.version}"`);

const actions = {
  "release-it": () => {
    log("action: release-it");
    runBuild();
    updateVersion();
    syncPackageJSON();
    updateChangelog();
    createGitTag();
    mergePR();
  },
  "release-beta": () => {
    log("action: release-beta");
    runBuild();        // ✅
    updateVersion();   // ✅
    syncPackageJSON(); // ✅
    updateChangelog(); // ✅
    createGitTag();
  },
  "skip-release": () => {

  },
}

actions[ACTION]();

// =========================================================
// Functions
// =========================================================
function runBuild() {
  log("🤖 - [runBuild] Running build command");
  DEBUG && log(COMMAND_BUILD);
  !DEBUG && execSync(COMMAND_BUILD, { stdio: "inherit" });
}

function mergePR() {
  log("🤖 - Merging the PR");
}

function updateChangelog() {
  log("🤖 - [updateChangelog] Updating the changelog");
  // 2 FILES must be saved:
  // - one on the root of the project
  // - one on the root of the package
  const CHANGELOG_FILE_PATH = path.join(PATH_TO_PACKAGE, "CHANGELOG.md");
  const CHANGELOG_ROOT_FILE_PATH = path.join(ROOT_PATH, "CHANGELOG.md");
  const hasChangelogFile = fs.existsSync(CHANGELOG_FILE_PATH); 
  const CHANGELOG_FILE = hasChangelogFile ? fs.readFileSync(CHANGELOG_FILE_PATH, "utf-8") : "";
  const parsedMessage = parseMessage(MESSAGE);

  const CHANGELOG_FILE_LINES = CHANGELOG_FILE.split("\n");
  CHANGELOG_FILE_LINES.unshift(`${parsedMessage}\n\n`);
  CHANGELOG_FILE_LINES.unshift(`# ${PACKAGE_JSON.version} - ${YEAR}-${MONTH}-${DAY}\n`);

  const UPDATED_CHANGELOG_FILE = CHANGELOG_FILE_LINES.join("\n");
  DEBUG && log(UPDATED_CHANGELOG_FILE);
  DEBUG && log(`Saved on ${CHANGELOG_FILE_PATH}!`);
  DEBUG && log(`Saved on ${CHANGELOG_ROOT_FILE_PATH}!`);
  !DEBUG && fs.writeFileSync(CHANGELOG_FILE_PATH, UPDATED_CHANGELOG_FILE);
  !DEBUG && fs.writeFileSync(CHANGELOG_ROOT_FILE_PATH, UPDATED_CHANGELOG_FILE);
}
function createGitTag() {
  log("🤖 - Create git TAG");
  const parsedMessage = parseMessage(MESSAGE);
  log(`git tag -a v${PACKAGE_JSON.version} -m "${parsedMessage}"`);
  log("🤖 - Push git TAG");
}

function updateVersion() {
  log("🤖 - [updateVersion] Updating the version");
  const version = PACKAGE_JSON.version.split(".");
  const major = version[0];
  const minor = version[1];
  const patch = version[2];

  if (ACTION === "release-beta") {
    PACKAGE_JSON.version = `${major}.${minor}.${patch}-beta${YEAR}${MONTH}${DAY}${MILLISECONDS}PR${PR_NUMBER}`;
    log(`Beta version bumped to ${PACKAGE_JSON.version}`);
    return;
  }

  switch (BUMP_KIND) {
    case "major":
      PACKAGE_JSON.version = `${parseInt(major) + 1}.0.0`;
      log(`Major version bumped to ${PACKAGE_JSON.version}`);
      break;
    case "minor":
      PACKAGE_JSON.version = `${major}.${parseInt(minor) + 1}.0`;
      log(`Minor version bumped to ${PACKAGE_JSON.version}`);
      break;
    case "patch":
      PACKAGE_JSON.version = `${major}.${minor}.${parseInt(patch) + 1}`;
      log(`Patch version bumped to ${PACKAGE_JSON.version}`);
      break;
    default:
      throw new Error("Invalid bump kind");
  }
}

function syncPackageJSON() {
  log("🤖 - [syncPackageJSON] Syncing package.json...");
  !DEBUG && fs.writeFileSync(path.join(PATH_TO_PACKAGE, "package.json"), JSON.stringify(PACKAGE_JSON, null, 2));
}

function parseMessage() {
  log("🤖 - [parseMessage] Parsing the message");

  const lines = MESSAGE.split("\n");
  const filteredLines = lines.filter(line => line.trim() !== "");
  const parsedMessage = filteredLines
    .map(line => line.replace("## Changelog", "").trim())
    .filter(Boolean)
    .join("\n");
  return parsedMessage;
}
// =========================================================
