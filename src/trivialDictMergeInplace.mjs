// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';
import equalPmb from 'equal-pmb';
import is from 'typechecks-pmb';



function mergeSubDict(destDict, pathSteps, updDict) {
  aMap(updDict, function mergeEntries(updVal, key) {
    if (updVal === undefined) { return; }
    const oldVal = destDict[key];
    if (oldVal === undefined) {
      destDict[key] = updVal; // eslint-disable-line no-param-reassign
      return;
    }
    if (is.dictObj(oldVal) && is.dictObj(updVal)) {
      const merged = mergeSubDict({ ...oldVal }, [...pathSteps, key], updVal);
      destDict[key] = merged; // eslint-disable-line no-param-reassign
      return;
    }
    try {
      equalPmb.deepStrictEqual(oldVal, updVal);
    } catch (unequal) {
      unequal.dictPath = [...pathSteps, key];
      unequal.name = 'trivialDictMergeError';
      throw unequal;
    }
  });
  return destDict;
}


function trivialDictMergeInplace(destDict, ...updates) {
  if (updates.length < 2) { return mergeSubDict(destDict, [], updates[0]); }
  updates.forEach(trivialDictMergeInplace.bind(null, destDict, []));
  return destDict;
};

export default trivialDictMergeInplace;
