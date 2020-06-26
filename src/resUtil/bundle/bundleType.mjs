// -*- coding: utf-8, tab-width: 2 -*-

import mergeOpt from 'merge-options';
import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be';
import aMap from 'map-assoc-core';
import getOwn from 'getown';
import bunUrls from 'ubborg-bundleurl-util-pmb';
import loPick from 'lodash.pick';

import relRes from '../parentRelUrlResource';
import slashableImport from '../../slashableImport';
import trivialDictMergeInplace from '../../trivialDictMergeInplace';

const { makeSpawner } = relRes;
const inhOP = 'inheritOtherParams';


const apiTimeoutsSec = (function compile() {
  const waitSub = 30;
  return {
    waitForAllSubPlanning: waitSub,
    hatch: waitSub + 1,
    finalizePlan: waitSub + 2,
  };
}());


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

  bun.mergeParamOverrides(impl.paramOverrides);
  bun.mergeParamOverrides(facts.overrideParam);
  bun.mergeParams(impl.param);
  bun.mergeParams(facts.param);

  // Merge params last: Otherwise the more assertive param sources may detect
  // conflict with existing default values.
  bun.mergeParamDefaults(impl.paramDefaults);
};


async function hatch(initExtras) {
  const bun = this;
  const fullUrl = bunUrls.href(bun.id);
  const modSpec = bunUrls.toModuleId(fullUrl);
  const impl = await slashableImport(modSpec);
  await prepareRunImpl(bun, { initExtras, impl });

  Object.assign(bun, {
    shortRelUrl(href) { return bunUrls.shorten(bunUrls.href(fullUrl, href)); },
  });

  const linCtx = initExtras.getLineageContext();
  const simplifiedLinCtx = loPick(linCtx, [
    'getResourcesByTypeName',
  ]);
  await impl.call(simplifiedLinCtx, bun);
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
  idProps: ['url'],
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
  apiTimeoutsSec,
};

const spawnCore = makeSpawner(recipe);


export default {
  recipe,
  makeSpawner,
  prepareRunImpl,
  plan(spec) { return spawnCore(this, spec); },
};
