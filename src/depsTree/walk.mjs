// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';
import pEachSeries from 'p-each-series';
import getOwn from 'getown';

function arrowJoin(l) { return l && l.map(String).join(' » '); }
function arrLast(i) { return this[this.length - (i || 1)]; }
function subIndent(c) { return (c.indentPrefix + c.indent + c.indentSuffix); }


function updateStacks(origCtx, relVerb, resPlan) {
  const valuesToBePushed = {
    // stack name -> value to be added if stack exists
    parentPlans: resPlan,
    parentVerbs: relVerb,
    stack: {},
  };
  if (!origCtx) {
    // Creating empty stacks for a fresh new top-level context.
    if (relVerb || resPlan) {
      throw new Error('Cannot push resource details without a parent context');
    }
    return aMap(valuesToBePushed, function makeEmptyArray() { return []; });
  }
  const { parentPlans, maxDiveDepth, forbidCyclicDive } = origCtx;
  const depth = parentPlans.length;
  if (depth > maxDiveDepth) {
    throw new Error('Trying to dive deeper (' + depth
      + ' levels) than maxDiveDepth (' + maxDiveDepth + ') @ '
      + String(origCtx));
  }
  const parentIndex = parentPlans.lastIndexOf(resPlan);
  const isCyclicDive = (parentIndex >= 0);
  const cycleSteps = (isCyclicDive && (depth - parentIndex));
  if (isCyclicDive && forbidCyclicDive) {
    throw new Error('Found a cyclic dependency while forbidCyclicDive is set: '
      + String(origCtx) + ' « ' + String(resPlan)
      + ' (' + cycleSteps + ' steps up)');
  }

  const arrayBonusFeatures = { arrLast };
  function updateOneStack(val, key) {
    const origStack = origCtx[key];
    return Object.assign([...origStack, val], arrayBonusFeatures);
  }
  const ctxUpd = {
    depth,
    cycleSteps,
    ...aMap(valuesToBePushed, updateOneStack),
  };
  return ctxUpd;
}


async function diveVerbsSeriesCore(ev, diver) {
  const verbsDict = ev.subRelVerbPrs; // potentially modified by foundRes
  async function collectOneVerb(verb) {
    const planPrs = verbsDict[verb];
    if (!planPrs) { return; }
    const plans = await Promise.all(planPrs);
    function diveIntoDep(subPr) {
      return diver(ev.subCtx, subPr, verb);
    }
    await pEachSeries(plans, diveIntoDep);
  }
  await pEachSeries(Object.keys(verbsDict).sort(), collectOneVerb);
}


function forkSubCtxState() {
  const { ourCtx, subCtx } = this;
  if (subCtx.state === ourCtx.state) { subCtx.state = { ...ourCtx.state }; }
  return subCtx.state;
}


async function walkDepsTreeCore(ourCtx, resPr, relVerb) {
  const resPlan = await resPr;
  await resPlan.hatchedPr;
  const resName = String(resPlan);
  let resNameParentIdPrefixEllipse = resName;

  if (ourCtx.depth >= 1) {
    const parId = ourCtx.parentPlans.slice(-1)[0].id;
    const fullId = resPlan.id;
    if (fullId.startsWith(parId)) {
      const id = '…' + fullId.slice(parId.length);
      resNameParentIdPrefixEllipse = resPlan.toString.call({ ...resPlan, id });
    }
  }

  const subCtx = {
    ...ourCtx,
    ...updateStacks(ourCtx, relVerb, resPlan),
    indent: ourCtx.subInd,
  };
  subCtx.subInd = subIndent(subCtx);

  const { knownRes, resNotes } = subCtx;
  if (!knownRes.has(resName)) { knownRes.set(resName, resPlan); }
  const notes = (resNotes.get(resName) || {});
  const nPrevEncounters = (notes.encounterNo || 0);
  notes.encounterNo = nPrevEncounters + 1;
  if (!nPrevEncounters) {
    resNotes.set(resName, notes);
    subCtx.nDiscovered += 1;
    notes.nthDiscovered = subCtx.nDiscovered;
  }

  function diveVerbsSeries(diver) {
    return diveVerbsSeriesCore(this, diver || walkDepsTreeCore);
  }

  const ev = {
    ourCtx,
    subCtx,
    diveVerbsSeries,
    forkSubCtxState,
    notes,
    nPrevEncounters,
    relVerb,
    resName,
    resNameParentIdPrefixEllipse,
    resPlan,
    subRelVerbPrs: { ...(await resPlan.relations.getRelatedPlanPromises()) },
  };
  await subCtx.foundRes(ev);
};


function ctxSelfToString() {
  const parPl = (this.parentPlans || false);
  if (!parPl.map) { return '[partially initialized context]'; }
  if (!parPl.length) { return '[empty context]'; }
  return ('[context ' + arrowJoin(parPl) + ']');
}


function walkDepsTree(opt) {
  const { root, foundRes } = (opt || false);
  if (!foundRes) { throw new Error('foundRes handler required'); }
  if (!root) { throw new Error('root resPlan required'); }
  function orDefault(defaultVal, key) {
    const optVal = getOwn(opt, key);
    if (optVal !== undefined) { return optVal; }
    if (defaultVal === Object) { return {}; }
    return defaultVal;
  }
  const topCtx = {
    knownRes: new Map(),
    resNotes: new Map(),
    nDiscovered: 0,
    ...updateStacks(),
    foundRes,
    ...aMap(walkDepsTree.defaultOpts, orDefault),
  };
  if (!topCtx.state) { topCtx.state = {}; }
  topCtx.subInd = subIndent(topCtx);
  return walkDepsTreeCore(topCtx, root, null);
}

walkDepsTree.defaultOpts = {
  toString: ctxSelfToString,
  maxDiveDepth: 64,
  forbidCyclicDive: true,
  indent: '',
  indentPrefix: '',
  indentSuffix: '',

  // some places for callback-specific mutable data
  config: Object,
  param: Object,
  state: Object,
};


export default walkDepsTree;
