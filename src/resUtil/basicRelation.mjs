// -*- coding: utf-8, tab-width: 2 -*-

import pProps from 'p-props';
import vTry from 'vtry';
import is from 'typechecks-pmb';
import goak from 'getoraddkey-simple';

import planResourceByTypeName from './planResourceByTypeName';
import mightBeResourcePlan from './mightBeResourcePlan';
import recipeTimeouts from './recipeTimeouts';

const rela = {};

function orf(x) { return (x || false); }
function listConcatOrNew(a, b) { return (a ? [...a, b] : [b]); }

function describeSpecShort(x) {
  if (is.pojo(x)) { return '{' + Object.keys(x).join(',') + '}'; }
  return String(x);
}


function relateToMaybeSpawn(res, spawning, verb, relResType, relSpec) {
  if (res.spawning) {
    const errMsg = (String(res) + ' can not yet relate to any new resource.'
      + ' It should do that while hatching.');
    throw new Error(errMsg);
  }
  if (!res.hatching) {
    const errMsg = (String(res) + ' can no longer relate to any new resource.'
      + ' It should have done that while hatching.');
    throw new Error(errMsg);
  }
  // console.debug('relateToMaybeSpawn:', typeof relResType, typeof relSpec);
  if (!relSpec) {
    if (is.obj(relResType)) {
      if (mightBeResourcePlan(relResType)) {
        const relRes = relResType;
        // console.debug('relateTo: no need to spawn a new', String(relRes),
        //   'for', String(res));
        return relRes;
      }
      throw new Error('Object must be a resource plan, not ' + relResType);
    }
    throw new Error('relSpec required to spawn a ' + relResType);
  }
  const subLin = vTry(
    spawning.forkLineageContext,
    'forkLineageContext of ' + res + ' because it ' + verb + ' a ' + relResType
  )({ relationVerb: verb });
  // console.debug('relateTo: gonna spawn a new', String(relResType),
  //   String(relSpec), 'for', String(res));
  const planPr = planResourceByTypeName(relResType, subLin, relSpec);
  return planPr;
}


Object.assign(rela, {

  prepareRelationsManagement(res) {
    const spw = res.spawning;
    if (spw.dupeOf) {
      throw new Error("A transient dupe should't relate to anything!");
    }

    const active = {};    // e.g. requires
    const passive = {};   // e.g. requiredBy

    const { relatedBy, relationVerb } = spw.getLineageContext();
    if (relatedBy) {
      const rDict = goak(passive, relationVerb, '{}');
      const rKey = relatedBy.toDictKey();
      const rDupe = rDict[rKey];
      if (rDupe !== res) {
        if (rDupe) {
          throw new Error(`Duplicate relation ${relationVerb} ${rKey}`);
        }
        rDict[rKey] = res;
      }
    }

    function relateTo(verb, relResType, relSpec) {
      if (Array.isArray(relSpec)) {
        return relSpec.map(sp => relateTo(verb, relResType, sp));
      }
      const errTrace = `${String(res)}.${verb}(${
        String(relResType)}, ${describeSpecShort(relSpec)})`;
      const planPr = vTry(relateToMaybeSpawn, errTrace)(res,
        spw,  // pass our cached ref b/c .spawning is deleted before hatch
        verb, relResType, relSpec);
      goak.pushToKey(active, verb, planPr);
      return planPr;
    }

    const makeResMtdTmoProxy = recipeTimeouts.makeResMtdTimeoutProxifier(res);
    const api = {
      getRelatedPlanPromises() { return active; },
      getRelatingPlans() { return passive; },
      relateTo,
      ...makeResMtdTmoProxy.mapFuncs({
        waitForAllSubPlanning: rela.waitForAllSubPlanningImpl.bind(null, res),
      }),
    };
    res.relations = api; // eslint-disable-line no-param-reassign
  },


  installRelationFuncs(res, verbs) {
    const rt = res.relations.relateTo;
    function installOneRelationFunc(verb) {
      function verbedRelateTo(...args) { return rt(verb, ...args); };
      res[verb] = verbedRelateTo; // eslint-disable-line no-param-reassign
    }
    verbs.forEach(installOneRelationFunc);
  },


  async exposeRelationListsOnVerbs(res, verbs) {
    res.mustHaveHatched('.exposeRelationListsOnVerbs()');
    const relPrLists = await res.relations.getRelatedPlanPromises();
    await Promise.all(verbs.map(async function makeList(verb) {
      const mtd = res[verb];
      mtd.list = await Promise.all(relPrLists[verb] || []);
    }));
  },


  async waitForAllSubPlanningImpl(res, opt) {
    if (!orf(opt).ignoreStillHatching) {
      res.mustHaveHatched('.waitForAllSubPlanning()');
    }
    const disPath = orf(opt).discoveryPath;
    const subDisPath = listConcatOrNew(disPath, res);
    const subOpt = {
      ...opt,
      discoveryPath: subDisPath,
      ignoreStillHatching: false,
    };
    async function waitForOneSubPlan(plan) {
      const subPlan = await plan;
      if (subPlan === res) { return subPlan; }
      if (disPath && disPath.includes(res)) { return subPlan; }
      const hasHatched = await subPlan.hatchedPr;
      const waitSub = (subPlan.relations || false).waitForAllSubPlanning;
      if (!subPlan.relations) {
        const err = `Subplan ${String(subPlan)} (hatched = ${hasHatched}) of ${
          String(plan)} does not (yet?) implement waitForAllSubPlanning.`;
        throw new Error(err);
      }
      await waitSub(subOpt);
      return subPlan;
    }
    async function collectOneVerb(relsPr) {
      const rels = await relsPr;
      const planPrs = await Promise.all(rels);
      const plans = await Promise.all(planPrs.map(waitForOneSubPlan));
      return plans.filter(Boolean);
    }
    const verbsDict = res.relations.getRelatedPlanPromises();
    const subRelPlans = await pProps(verbsDict, collectOneVerb);
    return subRelPlans;
  },

});


export default rela;
