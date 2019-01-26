// -*- coding: utf-8, tab-width: 2 -*-

import pProps from 'p-props';
import vTry from 'vtry';
import is from 'typechecks-pmb';

import goak from 'getoraddkey-simple';
import planResourceByTypeName from './planResourceByTypeName';
import mightBeResourcePlan from './mightBeResourcePlan';


const rela = {};


function relateToMaybeSpawn(res, spawning, verb, relResType, relSpec) {
  if (!(res.spawning || res.hatching)) {
    const errMsg = res + ' cannot currently relate to any new resource';
    throw new Error(errMsg);
  }
  const { makeSubContext } = spawning;
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
  const subCtx = makeSubContext({
    relatedBy: res,
    relationVerb: verb,
  });
  // console.debug('relateTo: gonna spawn a new', String(relResType),
  //   String(relSpec), 'for', String(res));
  const planPr = planResourceByTypeName(relResType, subCtx, relSpec);
  return planPr;
}


Object.assign(rela, {

  prepareRelationsManagement(res) {
    const { spawning } = res;
    const { dupeOf, getContext } = spawning;
    if (dupeOf) {
      throw new Error("A transient dupe should't relate to anything!");
    }

    const active = {};    // e.g. requires
    const passive = {};   // e.g. requiredBy

    const { relatedBy, relationVerb } = getContext();
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
      const errTrace = `${String(res)}.${verb}(${
        String(relResType)}, ${String(relSpec)})`;
      const planPr = vTry(relateToMaybeSpawn, errTrace)(res, spawning,
        verb, relResType, relSpec);
      goak.pushToKey(active, verb, planPr);
      return planPr;
    }

    const api = {
      getRelatedPlanPromises() { return active; },
      getRelatingPlans() { return passive; },
      relateTo,
      waitForAllPlanning() { return rela.waitForAllPlanning(res); },
      waitForAllSubPlanning() { return rela.waitForAllSubPlanning(res); },
    };
    res.relations = api; // eslint-disable-line no-param-reassign
  },


  installRelationFuncs(res, verbs) {
    const rt = res.relations.relateTo;
    verbs.forEach(function installOneRelationFunc(verb) {
      function verbedRelateTo(...args) { return rt(verb, ...args); };
      res[verb] = verbedRelateTo; // eslint-disable-line no-param-reassign
    });
  },


  async waitForAllPlanning(res) {
    if (!res.hatchedPr) {
      throw new Error(String(res) + " hasn't promised hatching yet");
    }
    const subRelPlans = await rela.waitForAllSubPlanning(res);
    await res.hatchedPr;
    return subRelPlans;
  },


  async waitForAllSubPlanning(res) {
    async function waitForOneSubPlan(plan) {
      const subPlan = await plan;
      await subPlan.relations.waitForAllPlanning();
      return subPlan;
    }
    async function collectOneVerb(relsPr) {
      const rels = await relsPr;
      const planPrs = await Promise.all(rels);
      const plans = await Promise.all(planPrs.map(waitForOneSubPlan));
      return plans;
    }
    const verbsDict = res.relations.getRelatedPlanPromises();
    const subRelPlans = await pProps(verbsDict, collectOneVerb);
    return subRelPlans;
  },

});


export default rela;
