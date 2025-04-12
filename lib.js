// =========================================================
// Imports
// =========================================================
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const log = console.log;
const DEBUG = false;
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
    createGitCommit(); // ✅
    createGitTag();    // ✅
    pushGitTag();      // ✅
    resetBetaCommit(); // ✅
    discardChanges();  // ✅
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

function resetBetaCommit() {
  log("🤖 - Resetting the beta commit");
  const gitCommand = `git reset HEAD~1`;

  DEBUG && log(gitCommand);
  !DEBUG && execSync(gitCommand, { stdio: "inherit" });
}

function discardChanges() {
  log("🤖 - Discarding changes");
  const gitCommand = `git clean -fd`;
  DEBUG && log(gitCommand);
  !DEBUG && execSync(gitCommand, { stdio: "inherit" });
}

function updateChangelog() {
  log("🤖 - [updateChangelog] Updating the changelog");
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
  DEBUG &&
    log(`Saved on ${CHANGELOG_FILE_PATH}!`);
  !DEBUG &&
    fs.writeFileSync(CHANGELOG_FILE_PATH, UPDATED_CHANGELOG_FILE);
  DEBUG &&
    log(`Saved on ${CHANGELOG_ROOT_FILE_PATH}!`);
  !DEBUG &&
    fs.writeFileSync(CHANGELOG_ROOT_FILE_PATH, UPDATED_CHANGELOG_FILE);
}
function createGitTag() {
  log("🤖 - Create git TAG");
  const parsedMessage = parseMessage(MESSAGE);
  const gitCommand = `git tag -a v${PACKAGE_JSON.version} -m "${parsedMessage}"`;

  DEBUG &&
    log(gitCommand);
  !DEBUG &&
    execSync(gitCommand, { stdio: "inherit" });
}

function pushGitTag() {
  log("🤖 - Push git TAG");
  const gitCommand = `git push origin v${PACKAGE_JSON.version}`;

  DEBUG &&
    log(gitCommand);
  !DEBUG &&
    execSync(gitCommand, { stdio: "inherit" });
}

function createGitCommit() {
  log("🤖 - Create git commit");
  
  const gitCommand = `git add . && git commit -m "Commiting ${PACKAGE_JSON.version} - ${YEAR}-${MONTH}-${DAY}"`;

  DEBUG &&
    log(gitCommand);
  !DEBUG &&
    execSync(gitCommand, { stdio: "inherit" });
}

function updateVersion() {
  log("🤖 - [updateVersion] Updating the version");
  const isVersionAlreadyBeta = PACKAGE_JSON.version.includes("beta");
  let newVersion;
  const CURRENT_VERSION = normalizeVersion(PACKAGE_JSON.version).split(".");

  const major = isVersionAlreadyBeta && BUMP_KIND === "major" ? CURRENT_VERSION[0] - 1 : CURRENT_VERSION[0];
  const minor = isVersionAlreadyBeta && BUMP_KIND === "minor" ? CURRENT_VERSION[1] - 1 : CURRENT_VERSION[1];
  const patch = isVersionAlreadyBeta && BUMP_KIND === "patch" ? CURRENT_VERSION[2] - 1 : CURRENT_VERSION[2];

  log(`Version: ${PACKAGE_JSON.version} -> ${major}.${minor}.${patch} [base version]`);

  switch (BUMP_KIND) {
    case "major":
      newVersion = `${parseInt(major) + 1}.${minor}.${patch}`;
      break;
    case "minor":
      newVersion = `${major}.${parseInt(minor) + 1}.${patch}`;
      break;
    case "patch":
      newVersion = `${major}.${minor}.${parseInt(patch) + 1}`;
      break;
    default:
      throw new Error("Invalid bump kind");
  }

  if (ACTION === "release-beta") {
    newVersion = `${newVersion}-beta${YEAR}${MONTH}${DAY}${MILLISECONDS}PR${PR_NUMBER}`;
  }

  log(`Applying ${newVersion} from ${PACKAGE_JSON.version} through a ${BUMP_KIND}`)
  PACKAGE_JSON.version = newVersion;
}

function syncPackageJSON() {
  log("🤖 - [syncPackageJSON] Syncing package.json...");
  !DEBUG &&
    fs.writeFileSync(path.join(PATH_TO_PACKAGE, "package.json"), JSON.stringify(PACKAGE_JSON, null, 2));
}

function parseMessage() {
  const lines = MESSAGE.split("\n");
  const filteredLines = lines.filter(line => line.trim() !== "");
  const parsedMessage = filteredLines
    .map(line => line.replace("## Changelog", "").trim())
    .filter(Boolean)
    .join("\n");
  return parsedMessage;
}
function normalizeVersion(version) {
  const versionParts = version.split(".");
  return `${versionParts[0]}.${versionParts[1]}.${versionParts[2].split("-")[0]}`;
}
// =========================================================
