// -*- coding: utf-8, tab-width: 2 -*-

import isStr from 'is-string';


function solveDebugHints(origDH, dupeDH, mergeCtx) {
  if (!origDH) { return dupeDH; }
  if (isStr(origDH)) { return solveDebugHints([origDH], dupeDH, mergeCtx); }
  if (isStr(dupeDH)) { return solveDebugHints(origDH, [dupeDH], mergeCtx); }
  if (Array.isArray(origDH) && Array.isArray(dupeDH)) {
    const merged = [...origDH, ...dupeDH];
    mergeCtx.forceUpdateOrigProps({ debugHints: merged });
    return dupeDH;
  }
  return false;
}


export default solveDebugHints;
