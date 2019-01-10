// -*- coding: utf-8, tab-width: 2 -*-

import goak from 'getoraddkey-simple';
import isStr from 'is-string';
import pMapSeries from 'p-map-series';
import normJoinPath from 'norm-join-path';
import mustBe from 'typechecks-pmb/must-be';

import resProv from './resourceProviders';
import slashableImport from '../slashableImport';

const bundleProvider = {
  enact() { return true; },
};

const planSeverities = [
  'needs',
];


function bundleToString() { return `[bundle ${this.path}]`; }


async function collectAllPlans(promisesByType) {
  const collected = {};
  async function collectOneType(tn) {
    collected[tn] = await Promise.all(promisesByType[tn]);
  }
  const typeNames = Object.keys(promisesByType);
  await Promise.all(typeNames.map(collectOneType));
  return collected;
}


function findBundleDirectory(bun) {
  if (!bun) { return '.'; }
  const { path } = bun;
  mustBe.nest('bundle path', bun.path);
  return (path.replace(/\/+[\x00-.0-\uFFFF]*$/, '') || '.');
}


async function planBundle(bundleSpec) {
  const parentContext = this;
  if (!parentContext) {
    const topCtx = {
      resourcesByTypeName: Object.create(null),
    };
    const topBun = await planBundle.call(topCtx, bundleSpec);
    topBun.context = topCtx;
    return topBun;
  }
  const bundleName = mustBe.nest('bundle name', bundleSpec['']);
  const parentBundle = parentContext.bundle;
  const resourcePlansPromisesByType = {};
  const requestedSubBundles = [];

  const bun = {
    parentBundle,
    basedir: findBundleDirectory(parentBundle),
    toString: bundleToString,
  };
  function subCtx() { return { ...parentContext, bundle: bun }; }

  async function plan(severity, typeName, details, ...unsupp) {
    if (unsupp.length) { throw new Error('too many arguments'); }
    if (Array.isArray(details)) {
      return Promise.all(details.map(d => plan(severity, typeName, d)));
    }
    if (isStr(details)) { return plan(severity, typeName, { '': details }); }
    if (typeName === 'bundle') {
      requestedSubBundles.push({ ...details, severity });
      return;
    }
    const planPromise = resProv.planByTypeName(typeName, subCtx(), details);
    goak.pushToKey(resourcePlansPromisesByType, typeName, planPromise);
  }

  planSeverities.forEach((sev) => {
    bun[sev] = function planSeverely(...args) { return plan(sev, ...args); };
  });

  const recipe = await slashableImport(bundleName);
  await recipe.call(bun);

  bun.plansByType = await collectAllPlans(resourcePlansPromisesByType);

  function loadSubBun(subDet) {
    const relName = mustBe.nest('sub bundle path', subDet['']);
    return resProv.planByTypeName('bundle', subCtx(),
      { ...subDet, '': normJoinPath(bun.basedir, relName) });
  }
  bun.plansByType.bundle = await pMapSeries(requestedSubBundles, loadSubBun);

  return bun;
}



bundleProvider.plan = planBundle;
export default bundleProvider;
