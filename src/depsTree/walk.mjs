// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';
import pEachSeries from 'p-each-series';

function arrLast(i) { return this[this.length - (i || 1)]; }
function subIndent(c) { return (c.indentPrefix + c.indent + c.indentSuffix); }


function updateStacks(orig, relVerb, resPlan) {
  return aMap({
    parentPlans: resPlan,
    parentVerbs: relVerb,
    stack: {},
  }, function updateOneStack(val, key) {
    return Object.assign((orig ? [...orig[key], val] : []), { arrLast });
  });
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
    depth: inheritedCtx.parentPlans.length,
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


function walkDepsTree(opt) {
  const { root, foundRes } = (opt || false);
  if (!foundRes) { throw new Error('foundRes handler required'); }
  if (!root) { throw new Error('root resPlan required'); }
  const ctx = {
    knownRes: new Map(),
    resNotes: new Map(),
    nDiscovered: 0,
    ...updateStacks(),
    foundRes,
  };
  function orDefault(val, key) { ctx[key] = (opt[key] || val); }
  aMap({
    state: {},
    indent: '',
    indentPrefix: '',
    indentSuffix: '',
  }, orDefault);
  ctx.subInd = subIndent(ctx);
  return walkDepsTreeCore(ctx, root, null);
}


export default walkDepsTree;
