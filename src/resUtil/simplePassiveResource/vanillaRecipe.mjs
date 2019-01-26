// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';

import mightBeResourcePlan from '../mightBeResourcePlan';
import basicRelation from '../basicRelation';


const vanillaRecipe = {

  spawnTimeoutSec: 5,

  relationVerbs: [
    'needs',
    'suggests',
    'conflictsWith',
  ],

  makeSubContext(origCtx, changes) {
    const { relatedBy, relationVerb } = changes;
    mustBe.nest('relationVerb', relationVerb);
    if (!mightBeResourcePlan(relatedBy)) {
      console.debug('Bad parent:', relatedBy);
      throw new Error('Bad parent: ' + relatedBy);
    }
    const parentReason = String(relatedBy) + '.' + relationVerb;
    const parStk = origCtx.traceParents().concat(parentReason);
    const subCtx = {
      ...origCtx,
      ...changes,
      traceParents() { return parStk; },
    };
    return subCtx;
  },

  installRelationFuncs(res, typeMeta) {
    basicRelation.installRelationFuncs(res, typeMeta.relationVerbs);
  },

};


export default vanillaRecipe;
