// -*- coding: utf-8, tab-width: 2 -*-

import promisedFs from 'nofs';
import stripBom from 'strip-bom';


async function readListFile(path) {
  const text = await promisedFs.readFile(path, 'UTF-8');
  const lines = stripBom(text).split(/\n/);
  function stripComments(s) { return s.split(/#|\/{2}/)[0].trim(); }
  const items = lines.map(stripComments).filter(Boolean);
  return items;
}


async function makeChecker(popCliArg) {
  const availFile = popCliArg('aptpkgnames-avail');
  // ^-- To obtain the list: apt list | cut -d / -sf 1 | sort -V >aptpkg.txt
  if (!availFile) { return false; }
  const pkgNamesAvail = new Set(await readListFile(availFile));
  const cpn = function checkPkgName(pkgName) {
    const warns = [];
    if (!pkgNamesAvail.has(pkgName)) { warns.push('Package not available'); }
    return warns;
  };
  return cpn;
}







export default makeChecker;
