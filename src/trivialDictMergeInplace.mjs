// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';
import equalPmb from 'equal-pmb';
import is from 'typechecks-pmb';
import getOwn from 'getown';


function findSubSolver(sol, key) {
  if (!sol) { return; }
  if (is.fun(sol)) { return getOwn(sol.sub, key, sol); }
  return (is.dictObj(sol) && getOwn(sol, key));
}


function mergeSubDict(destDict, pathSteps, updDict, solvers, solverHints) {
  if (!updDict) {
    // Avoid constructing the mergeEntries closure in vain.
    return destDict;
  }
  aMap(updDict, function mergeEntries(updVal, key) {
    if (updVal === undefined) { return; }
    const oldVal = getOwn(destDict, key);
    if (oldVal === undefined) {
      destDict[key] = updVal; // eslint-disable-line no-param-reassign
      return;
    }
    const subSteps = [...pathSteps, key];
    const solve = findSubSolver(solvers, key);
    if (is.dictObj(oldVal) && is.dictObj(updVal)) {
      const merged = mergeSubDict({ ...oldVal }, subSteps, updVal,
        solve, solverHints);
      destDict[key] = merged; // eslint-disable-line no-param-reassign
      return;
    }
    try {
      equalPmb.deepStrictEqual(oldVal, updVal);
    } catch (unequal) {
      unequal.dictPath = subSteps;
      unequal.name = 'trivialDictMergeError';
      if (is.fun(solve)) {
        const solVal = solve(oldVal, updVal,
          { ...solverHints, dictPath: subSteps, err: unequal });
        if (solVal !== undefined) {
          destDict[key] = solVal; // eslint-disable-line no-param-reassign
          return;
        }
      }
      throw unequal;
    }
  });
  return destDict;
}


function trivialDictMergeInplace(destDict, upd, solvers, solverHints) {
  mergeSubDict(destDict, [], upd, solvers, solverHints);
  return destDict;
};

export default trivialDictMergeInplace;
