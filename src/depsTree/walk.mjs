// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';
import pEachSeries from 'p-each-series';

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
    // Creating empty stacks for a fresh new ctx.
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
      return diver(ev.ctx, subPr, verb);
    }
    await pEachSeries(plans, diveIntoDep);
  }
  await pEachSeries(Object.keys(verbsDict).sort(), collectOneVerb);
}


function forkState() {
  const { ctx } = this;
  const orig = ctx.inheritedState;
  if (ctx.state === orig) { ctx.state = { ...orig }; }
  return ctx.state;
}


async function walkDepsTreeCore(inheritedCtx, resPr, relVerb) {
  const resPlan = await resPr;
  await resPlan.hatchedPr;
  const resName = String(resPlan);

  const ctx = {
    ...inheritedCtx,
    ...updateStacks(inheritedCtx, relVerb, resPlan),
    inheritedState: inheritedCtx.state,
  };

  if (ctx.depth > 0) {
    ctx.indent = ctx.subInd;
    ctx.subInd = subIndent(ctx);
  }

  const { knownRes, resNotes } = ctx;
  if (!knownRes.has(resName)) { knownRes.set(resName, resPlan); }
  const notes = (resNotes.get(resName) || {});
  const nPrevEncounters = (notes.encounterNo || 0);
  notes.encounterNo = nPrevEncounters + 1;
  if (!nPrevEncounters) {
    resNotes.set(resName, notes);
    ctx.nDiscovered += 1;
    notes.nthDiscovered = ctx.nDiscovered;
  }

  function diveVerbsSeries(diver) {
    return diveVerbsSeriesCore(this, diver || walkDepsTreeCore);
  }

  const ev = {
    ctx,
    diveVerbsSeries,
    forkState,
    notes,
    nPrevEncounters,
    relVerb,
    resName,
    resPlan,
    subRelVerbPrs: { ...(await resPlan.relations.getRelatedPlanPromises()) },
  };
  await ctx.foundRes(ev);
};


function ctxSelfToString() {
  const parPl = (this.parentPlans || false);
  if (!parPl.map) { return '[partially initialized context]'; }
  if (!parPl.length) { return '[empty context]'; }
  return ('[context ' + parPl.map(String).join(' » ') + ']');
}


function walkDepsTree(opt) {
  const { root, foundRes } = (opt || false);
  if (!foundRes) { throw new Error('foundRes handler required'); }
  if (!root) { throw new Error('root resPlan required'); }
  function orDefault(defaultVal, key) {
    const optVal = opt[key];
    if (optVal === undefined) { return defaultVal; }
    return optVal;
  }
  const ctx = {
    knownRes: new Map(),
    resNotes: new Map(),
    nDiscovered: 0,
    ...updateStacks(),
    foundRes,
    ...aMap(walkDepsTree.defaultOpts, orDefault),
  };
  ctx.subInd = subIndent(ctx);
  return walkDepsTreeCore(ctx, root, null);
}

walkDepsTree.defaultOpts = {
  toString: ctxSelfToString,
  maxDiveDepth: 64,
  forbidCyclicDive: true,
  state: {},
  indent: '',
  indentPrefix: '',
  indentSuffix: '',
};


export default walkDepsTree;
