// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';

import mightBeResourcePlan from '../mightBeResourcePlan';
import basicRelation from '../basicRelation';

const apiTimeoutsSec = (function compile() {
  const spawn = 2;
  const waitSub = spawn * 2;
  return {
    spawn,
    waitForAllSubPlanning: waitSub,
    finalizePlan: waitSub,
  };
}());


const vanillaRecipe = {

  acceptProps: {},
  defaultProps: {},

  apiTimeoutsSec,

  relationVerbs: [
    'needs',
    'suggests',
    'conflictsWith',
  ],

  uniqueIndexProps: [],

  forkLineageContext(ourLinCtx, changes) {
    const { relationVerb } = changes;
    mustBe.nest('relationVerb', relationVerb);
    const relatedBy = this;
    // ^- with an active relationVerb like "needs", relatedBy would be the
    //    dependent resource. The target (resource "needed") might not even
    //    have been planned yet.
    const badParent = mightBeResourcePlan.whyNot(relatedBy);
    if (badParent) {
      throw new Error('Bad parent: ' + badParent + ': ' + relatedBy);
    }
    const parentReason = String(relatedBy) + '.' + relationVerb;
    const parStk = ourLinCtx.traceParents().concat(parentReason);
    const subCtx = {
      ...ourLinCtx,
      ...changes,
      relatedBy,
      traceParents() { return parStk; },
    };
    return subCtx;
  },

  installRelationFuncs(res, typeMeta) {
    basicRelation.installRelationFuncs(res, typeMeta.relationVerbs);
  },

};


export default vanillaRecipe;
