// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';
import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be.js';


const stateToCateg = {
  installed: 'installs',
  absent: 'removes',
  banned: 'removes',
};


function valuesToArrayOr0(ctnr) {
  const arr = Array.from(ctnr.values());
  return (arr.length && arr);
}


async function reportDeferredDebPkg(subResList) {
  if (!(subResList || false).length) { return false; }
  const found = {
    modifies: new Set(),
    installs: new Set(),
    removes: new Set(),
  };
  await Promise.all(subResList.map(async function chk(res) {
    const { typeName, id } = res;
    mustBe.nest('resource type name', typeName);
    if (typeName !== 'debPkg') { return; }
    const facts = await res.toFactsDict();
    const defer = mustBe('bool', String(res) + '.defer')(facts.defer);
    if (!defer) { return; }
    found.modifies.add(id);
    const { state } = facts;
    const categ = getOwn(stateToCateg, state);
    if (categ) { return found[categ].add(id); }
    throw new Error('Unsupported state for ' + String(res) + ': ' + state);
  }));
  const report = aMap(found, valuesToArrayOr0);
  return report;
}


export default reportDeferredDebPkg;
