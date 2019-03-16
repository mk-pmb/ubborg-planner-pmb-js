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


async function walkDepsTreeCore(inheritedCtx, resPr, relVerb) {
  const resPlan = await resPr;
  await resPlan.hatchedPr;
  const resName = String(resPlan);

  const ctx = {
    ...inheritedCtx,
    ...updateStacks(inheritedCtx, relVerb, resPlan),
    depth: inheritedCtx.parentPlans.length,
  };

  const { knownRes } = ctx;
  const inheritedNotes = knownRes.get(resName);
  const notes = (inheritedNotes || {});
  if (!inheritedNotes) { knownRes.set(resName, resPlan); }

  if (ctx.depth > 0) {
    ctx.indent = ctx.subInd;
    ctx.subInd = subIndent(ctx);
  }
  if (notes.encounterNo) {
    notes.encounterNo += 1;
  } else {
    notes.encounterNo = 1;
    ctx.nDiscovered += 1;
    notes.nthDiscovered = ctx.nDiscovered;
  }

  function diveVerbsSeries(diver) {
    return diveVerbsSeriesCore(this, diver || walkDepsTreeCore);
  }

  const ev = {
    ctx,
    diveVerbsSeries,
    notes,
    relVerb,
    resName,
    resPlan,
    subRelVerbPrs: { ...(await resPlan.relations.getRelatedPlanPromises()) },
  };
  await ctx.foundRes(ev);
};


function walkDepsTree(opt) {
  const ctx = {
    knownRes: new Map(),
    nDiscovered: 0,
    ...updateStacks(),
  };
  function orDefault(val, key) { ctx[key] = (opt[key] || val); }
  aMap({
    state: {},
    indent: '',
    indentPrefix: '',
    indentSuffix: '',
    foundRes: null,
  }, orDefault);
  ctx.subInd = subIndent(ctx);

  if (!ctx.foundRes) { throw new Error('foundRes handler required'); }
  return walkDepsTreeCore(ctx, opt.root, null);
}


export default walkDepsTree;
