// -*- coding: utf-8, tab-width: 2 -*-

function orf(x) { return x || false; }




function foundResCheckFacts(ev) {
  const { factsDict, ourCtx, resName } = ev;
  delete factsDict.basedir;

  const { aptPkgNamesChecker } = ourCtx.config;
  if (aptPkgNamesChecker) {
    const { installs } = orf(factsDict.deferredDebPkgs);
    if (Array.isArray(installs)) {
      installs.forEach(function collectWarnings(pkgName) {
        const warns = aptPkgNamesChecker(pkgName);
        if (!warns.length) { return; }
        warns.forEach(w => console.warn([resName, w, pkgName].join(': ')));
      });
    }
  }
}


export default {
  foundResCheckFacts,
};
