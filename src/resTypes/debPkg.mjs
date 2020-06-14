// -*- coding: utf-8, tab-width: 2 -*-

import is from 'typechecks-pmb';
import mustBe from 'typechecks-pmb/must-be';

import spRes from '../resUtil/simplePassiveResource';

import claimStageFacts from './stage/claimStageFacts';


const defaultPolicy = {
  tryPreserveOldConfig: true,
  conflict: 'flinch',       // fixable by removing other stuff
  incompatible: 'flinch',   // not auto-fixable
};


async function finalizePlan(initExtras) {
  await claimStageFacts(initExtras, function claims(facts) {
    if (!facts.defer) { return; }
    const { policy } = facts;
    // Use resolved effective policy (including defaults), because
    // indifference might silently accept really destructive options.
    return { deferredDebPkgs: { policy } };
  });
}


const recipe = {
  typeName: 'debPkg',
  idProps: ['name'],
  defaultProps: {
    state: 'installed',
    defer: true,  // defer actual apt action to end of stage
    policy: defaultPolicy,
  },
  acceptProps: {
    presenceMarker: true,
    // ^-- Almost never needed on Ubuntu. The default is amazingly accurate.
  },
  promisingApi: {
    finalizePlan,
  },
};

const spawnCore = spRes.makeSpawner(recipe);

const simpleStates = [
  recipe.defaultProps.state,
  'absent',
  'banned',
];


async function plan(spec) {
  if (is.str(spec)) { return plan.call(this, { name: spec }); }
  const { state, presenceMarker: origPresMark } = spec;
  mustBe([['oneOf', [undefined, ...simpleStates]]], 'state')(state);
  const [name, arrowPresMark, ...morePresMarks] = spec.name.split(/\s+=>\s+/);
  if (arrowPresMark !== undefined) {
    mustBe.nest('presenceMarker (via arrow notation in name)', arrowPresMark);
    if (origPresMark) { morePresMarks.push(origPresMark); }
  }
  if (morePresMarks.length > 1) {
    throw new Error("Multiple presence markers aren't supported yet");
  }
  const res = await spawnCore(this, {
    presenceMarker: arrowPresMark,
    ...spec,
    name,
  });
  return res;
}


export default {
  plan,
  recipe,
};
