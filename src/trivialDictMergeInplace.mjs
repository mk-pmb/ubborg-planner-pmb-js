// -*- coding: utf-8, tab-width: 2 -*-

import equalPmb from 'equal-pmb';

function trivialDictMergeInplace(destDict, ...updates) {
  if (updates.length > 1) {
    updates.forEach(u => trivialDictMergeInplace(destDict, u));
    return destDict;
  }
  const [updDict] = updates;
  if (!updDict) { return destDict; }
  Object.keys(updDict).forEach(function mergeEntries(key) {
    const updVal = updDict[key];
    if (updVal === undefined) { return; }
    const oldVal = destDict[key];
    if (oldVal === undefined) {
      destDict[key] = updVal; // eslint-disable-line no-param-reassign
      return;
    }
    try {
      equalPmb.deepStrictEqual(oldVal, updVal);
    } catch (unequal) {
      unequal.dictKey = key;
      unequal.name = 'trivialDictMergeError';
      throw unequal;
    }
  });
  return destDict;
};

export default trivialDictMergeInplace;
