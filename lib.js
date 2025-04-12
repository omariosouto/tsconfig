// =========================================================
// Imports
// =========================================================
const log = console.log;
const DEBUG = false;
const PR_NUMBER = 1;
const BUMP_KIND= "patch"; // major (x.0.0), minor (0.x.0), patch (0.0.X), beta (`0.0.0-beta20251231${PR_NUMBER}`)
const MESSAGE = "Message to be added to the changelog";
const ACTION = "release-it";
// =========================================================
log("[PackagePublisher]");


const actions = {
  "release-it": () => {
    log("Release it");
    mergePR();
  },
  "release-beta": () => {

  },
  "skip-release": () => {

  },
}

actions[ACTION]();

// =========================================================
// Functions
// =========================================================
function mergePR() {
  log("🤖 - Merging the PR");
}


// =========================================================

/*

- release-it
- release-beta
- skip-release

- Sempre que comentar, ele gera uma TAG da versão 
  - 0.0.0-betaANOMESDIAPRNUMBER [tag da versão]
- O changelog vem da descrição do PR
- o próprio bot mergeia o PR
- o próprio bot precisa commitar na branch atualizando a versão SNAPSHOT

*/