// -*- coding: utf-8, tab-width: 2 -*-

import mergeOpt from 'merge-options';
import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be';
import aMap from 'map-assoc-core';
import getOwn from 'getown';
import bunUrls from 'ubborg-bundleurl-util-pmb';
import loPick from 'lodash.pick';
import vTry from 'vtry';

import relRes from '../parentRelUrlResource';
import slashableImport from '../../slashableImport';
import trivialDictMergeInplace from '../../trivialDictMergeInplace';

import makeParamPopperImpl from './makeParamPopper';

const { makeSpawner } = relRes;
const inhPExpl = 'inheritParam';
const inhOP = 'inheritOtherParams';
const mbBoolOrUndef = mustBe('undef | bool');
const objHas = Object.prototype.hasOwnProperty;
const blameBundleImpl = 'While running the custom bundle implementation';


const apiTimeoutsSec = (function compile() {
  const waitSub = 30;
  return {
    waitForAllSubPlanning: waitSub,
    hatch: waitSub + 1,
    finalizePlan: waitSub + 2,
  };
}());


function copyInheritedParams(parentBundle, dfParam, explicit, others) {
  mustBe.bool(inhOP, others);
  if (!parentBundle) { return {}; }
  const parentParams = parentBundle.getParams();
  const bequest = {};
  aMap(parentParams, function maybeCopy(v, k) {
    const expl = mbBoolOrUndef(inhPExpl + '.' + k, getOwn(explicit, k));
    if (expl === false) { return; }
    const copy = (expl || others || (dfParam && objHas.call(dfParam, k)));
    // console.debug('maybeCopy', { k, expl, others, copy });
    if (copy) { bequest[k] = v; }
  });
  const shallowCopy = mergeOpt(bequest);
  return shallowCopy;
}


async function prepareRunImpl(bun, how) {
  const { initExtras, impl } = how;
  mustBe.fun('bundle implementation', impl);
  const mustImpl = objPop.d({
    toString() { return 'implementation of ' + String(bun); },
    paramDefaults: {},
    ...impl,
  }, { mustBe }).mustBe;
  function implDict(k) { return mustImpl('undef | nul | dictObj', k); }
  const dfParam = implDict('paramDefaults');

  await mustImpl('fun', 'precheckFacts', Boolean)(bun);
  const facts = await bun.toFactsDict({ acceptPreliminary: true });
  const mustFact = mustBe.tProp('bundle fact ', facts);

  const linCtx = initExtras.getLineageContext();
  const { parentBundle } = linCtx;
  let curParam = copyInheritedParams(parentBundle, dfParam,
    implDict(inhPExpl), mustImpl('bool', inhOP, true));

  Object.assign(bun, {
    getParams() { return curParam; },
    makeParamPopper(opt) { return makeParamPopperImpl(bun, opt); },
    mergeParamDefaults(df) { curParam = mergeOpt(df, curParam); },
    mergeParamOverrides(ovr) { mergeOpt.call(curParam, ovr); },
    mergeParams(upd) { trivialDictMergeInplace(curParam, upd); },
  });

  bun.mergeParamOverrides(implDict('paramOverrides'));
  bun.mergeParamOverrides(mustFact('undef | dictObj', 'overrideParam'));
  bun.mergeParams(implDict('param'));
  bun.mergeParams(mustFact('undef | dictObj', 'param'));

  // Merge params last: Otherwise the more assertive param sources may detect
  // conflict with existing default values.
  bun.mergeParamDefaults(dfParam);

  mustImpl('fun', 'toString');
  mustImpl.expectEmpty('Unsupported bundle features');
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
  await vTry.pr(impl.bind(simplifiedLinCtx, bun), blameBundleImpl)();
  await bun.relations.waitForAllSubPlanning({ ignoreStillHatching: true });
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
  defaultProps: {
  },
  acceptProps: {
    param: true,
    [inhPExpl]: true,
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
  plan(...args) { return spawnCore(this, ...args); },
};
