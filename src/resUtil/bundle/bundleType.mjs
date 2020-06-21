// -*- coding: utf-8, tab-width: 2 -*-

import mergeOpt from 'merge-options';
import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be';
import aMap from 'map-assoc-core';
import getOwn from 'getown';

import relRes from '../resUtil/parentRelPathResource';
import slashableImport from '../slashableImport';
import trivialDictMergeInplace from '../trivialDictMergeInplace';

const { makeSpawner } = relRes;
const inhOP = 'inheritOtherParams';


function copyInheritedParams(parentBundle, explicit, others) {
  if (!parentBundle) { return {}; }
  const parentParams = parentBundle.getParams();
  if (!explicit) { return (others ? mergeOpt(parentParams) : {}); }
  const bequest = {};
  aMap(parentParams, function maybeCopy(v, k) {
    const descr = inhOP + JSON.stringify([k]);
    if (mustBe.bool(descr, explicit[k], others)) { bequest[k] = v; }
  });
  const shallowCopy = mergeOpt(bequest);
  return shallowCopy;
}


async function prepareRunImpl(bun, how) {
  const { typeName } = bun; // may differ in derived types.
  const { initExtras, impl } = how;
  mustBe.fun('bundle implementation', impl);

  if (impl.precheckFacts) { await impl.precheckFacts(bun); }
  const facts = await bun.toFactsDict({ acceptPreliminary: true });
  const mustFact = mustBe.prop(facts);

  const linCtx = initExtras.getLineageContext();
  const { parentBundle } = linCtx;
  let param = copyInheritedParams(parentBundle,
    mustFact('undef | nul | dictObj', 'inheritParam', impl.inheritParam),
    mustFact('undef | bool', inhOP, getOwn(impl, inhOP, true)));

  const paramPopOpt = {
    mustBe,
    leftoversMsg: `Unsupported ${typeName} param(s)`,
  };
  Object.assign(bun, {
    getParams() { return param; },
    makeParamPopper(opt) { return objPop(param, { ...paramPopOpt, ...opt }); },
    mergeParamDefaults(df) { param = mergeOpt(df, param); },
    mergeParamOverrides(ovr) { mergeOpt.call(param, ovr); },
    mergeParams(upd) { trivialDictMergeInplace(param, upd); },
  });

  bun.mergeParamDefaults(impl.paramDefaults);
  bun.mergeParamOverrides(impl.paramOverrides);
  bun.mergeParamOverrides(facts.overrideParam);
  bun.mergeParams(impl.param);
  bun.mergeParams(facts.param);
};


async function hatch(initExtras) {
  const bun = this;
  const impl = await slashableImport(bun.id);
  await prepareRunImpl(bun, { initExtras, impl });
  await impl(bun);
}


function forkLineageContext(ourLinCtx, changes) {
  const bun = this;
  const upd = {
    parentBundle: bun,
    ...changes,
  };
  return relRes.recipe.forkLineageContext.call(bun, ourLinCtx, upd);
}


const recipe = {
  ...relRes.recipe,
  typeName: 'bundle',
  idProps: ['path'],
  defaultProps: {
  },
  acceptProps: {
    param: true,
    inheritParam: true,
    [inhOP]: true,
    overrideParam: true,
  },
  promisingApi: {
    hatch,
    finalizePlan() { return this.hatchedPr; },
  },
  forkLineageContext,
};

const spawnCore = makeSpawner(recipe);


export default {
  recipe,
  makeSpawner,
  prepareRunImpl,
  plan(spec) { return spawnCore(this, spec); },
};
