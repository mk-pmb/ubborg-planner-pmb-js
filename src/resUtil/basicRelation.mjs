// -*- coding: utf-8, tab-width: 2 -*-

import pProps from 'p-props';

import goak from 'getoraddkey-simple';
import planResourceByTypeName from './planResourceByTypeName';


const rela = {};
Object.assign(rela, {

  prepareRelationsManagement(res) {
    const { dupeOf, getContext, makeSubContext } = res.spawning;
    if (dupeOf) {
      throw new Error("A transient dupe should't relate to anything!");
    }

    const active = {};    // e.g. requires
    const passive = {};   // e.g. requiredBy

    const { relatedBy, relatedVerb } = getContext();
    if (relatedBy) {
      const rDict = goak(passive, relatedVerb, '{}');
      const rKey = relatedBy.toDictKey();
      const rDupe = rDict[rKey];
      if (rDupe !== res) {
        if (rDupe) {
          throw new Error(`Duplicate relation ${relatedVerb} ${rKey}`);
        }
        rDict[rKey] = res;
      }
    }

    function relateTo(verb, relResType, relSpec) {
      if (!(res.spawning || res.hatching)) {
        throw new Error(`Fully hatched ${
          String(res)} cannot relate to any new ${relResType}`);
      }
      const subCtx = makeSubContext({
        relatedBy: res,
        relatedVerb: verb,
      });
      const planPr = planResourceByTypeName(relResType, subCtx, relSpec);
      goak.pushToKey(active, verb, planPr);
      return planPr;
    }

    const api = {
      getRelatedPlanPromises() { return active; },
      getRelatingPlans() { return passive; },
      relateTo,
      waitForAllPlanning() { return rela.waitForAllPlanning(res); },
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
    await res.hatchedPr;
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
