// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be';
import goak from 'getoraddkey-simple';
import vTry from 'vtry';
import is from 'typechecks-pmb';
import pProps from 'p-props';

import joinIdParts from './joinIdParts';
import verifyAcceptProps from './verifyAcceptProps';
import trivialDictMergeInplace from '../trivialDictMergeInplace';
import makeResDepFunc from './makeResDepFunc';


function resToString() { return `${this.typeName}[${this.id}]`; }


const apiBasics = {

  incubate(newProps) {
    const res = this;
    const typeMeta = res.getTypeMeta();
    verifyAcceptProps(typeMeta, newProps);
    const { dupeOf } = res.spawning;
    if (!dupeOf) {
      res.props = { ...newProps };
      return res;
    }
    try {
      trivialDictMergeInplace(dupeOf.props, newProps);
    } catch (caught) {
      if (caught.name === 'trivialDictMergeError') {
        const dunno = `No idea how to merge unequal ${
          String(res)} property "${caught.dictKey}": `;
        caught.message = dunno + caught.message;
      }
      throw caught;
    }
    return dupeOf;
  },

  prepareDependenciesManagement() {
    const res = this;
    const { dupeOf, getContext } = res.spawning;
    if (dupeOf) {
      throw new Error("A transient dupe should't depend on anything!");
    }
    const deps = [];
    const dpnd = {};
    Object.assign(res, {
      getDependencyPlanPromises() { return deps; },
      getDependentsPlans() { return dpnd; },
    });
    const { requestedBy, requestVerb } = getContext();
    if (requestedBy) {
      const rqDict = goak(dpnd, requestVerb, '{}');
      const rqKey = requestedBy.toDictKey();
      const rqDupe = rqDict[rqKey];
      if (rqDupe !== res) {
        if (rqDupe) {
          throw new Error(`Duplicate dependent ${rqKey} ${requestVerb}`);
        }
        rqDict[rqKey] = res;
      }
    }
  },

  async waitForAllPlanning() {
    const res = this;
    async function collectOneVerbDict(vd) {
      const depVerbPlans = await pProps(vd);
      return depVerbPlans;
    }
    const verbDicts = res.getDependencyPlanPromises();
    const subDepPlans = await pProps(verbDicts, collectOneVerbDict);
    return subDepPlans;
  },

  hatch() {},   // thus "simple passive"
};


const vanillaRecipe = {

  dependencyVerbs: [
    'needs',
  ],

  installResDepFuncs(res, typeMeta) {
    makeResDepFunc.install(this, res, typeMeta.dependencyVerbs);
  },

};


function startHatching(res, ...hatchArgs) {
  async function waitUntilHatched() {
    await res.hatch(...hatchArgs);
    res.hatching = false;
    return res;
  }
  res.hatching = true;
  // ^- Gotta set this first to avoid a time of undefined state: Even if we
  //    called wait…() first, it would be deferred as per promise spec.
  res.hatchedPr = waitUntilHatched();
  return res;
}


function makeSpawner(recipe) {
  const recPop = objPop(recipe);
  recPop.nest = key => mustBe.nest(key, recPop(key));
  const typeName = recPop.nest('typeName');
  const idProp = recPop('idProp');
  const api = { ...apiBasics, ...recPop.ifHas('api') };
  const acceptProps = recPop.ifHas('acceptProps', {});
  function vanil(k) { return recPop.ifHas(k, vanillaRecipe[k]); }
  const installResDepFuncs = vanil('installResDepFuncs');
  const typeMeta = {
    name: typeName,
    idProp,
    defaultProps: recPop.ifHas('defaultProps', {}),
    dependencyVerbs: vanil('dependencyVerbs'),
    acceptProps,
  };
  recPop.expectEmpty('Unsupported recipe feature(s)');

  function copyProps(orig) {
    if (is.obj(orig)) { return { ...orig }; }
    if (is.str(idProp)) { return { [idProp]: orig }; }
    throw new Error('Unsupported props format for ' + typeName);
  }

  const idJoiner = vTry(joinIdParts, 'construct ID for ' + typeName);

  async function spawn(ctx, origProps) {
    const props = copyProps(origProps);
    const mgdRes = mustBe.prop('obj', ctx, 'resourcesByTypeName');
    const { requestedBy } = ctx;
    const mgdSameType = goak(mgdRes, typeName, '{}');
    const popProp = objPop.d(props);
    const id = idJoiner(idProp, popProp);
    const dupeOf = mgdSameType[id];

    const res = {
      typeName,
      id,
      getTypeMeta() { return typeMeta; },
      toString: resToString,
      toDictKey: resToString,
      spawning: {
        dupeOf,
        getContext() { return ctx; },
      },
      parent: requestedBy, // ok to be discarded in case of dupe
      dependents: null, // don't accept deps until self-registered
    };
    installResDepFuncs.call(ctx, res, typeMeta);

    Object.keys(api).forEach(function installProxy(mtdName) {
      const impl = api[mtdName];
      if (!impl) { return; }
      async function mtdProxy(...args) { return impl.apply(res, args); }
      res[mtdName] = vTry.pr(mtdProxy, `${String(res)}.${mtdName}`);
    });

    await res.incubate(props);
    if (dupeOf) {
      const ack = await dupeOf.mergeUpdate(res);
      if (ack === dupeOf) { return dupeOf; }
      throw new Error('Unmerged duplicate resource ID for ' + String(res));
    }

    mgdSameType[id] = res;
    await res.prepareDependenciesManagement();

    delete res.spawning;
    startHatching(res, props);
    return res;
  }

  Object.assign(spawn, { typeMeta });
  return spawn;
}



export default {
  apiBasics,
  makeSpawner,
};
