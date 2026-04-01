// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';
import unwrapSingleKey from 'unwrap-single-prop';

import spRes from '../resUtil/simplePassiveResource/index.mjs';
import claimStageFacts from '../resUtil/bundle/claimStageFacts.mjs';


const defaultPolicy = {
  tryPreserveOldConfig: true,
  conflict: 'flinch',       // fixable by removing other stuff
  incompatible: 'flinch',   // not auto-fixable
};


const tracePkgNames = []; // a hack for debugging.

const plausiblePkgNameRx = /^[a-z][\w\-\+\.]+$/;


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

const simpleStates = [
  recipe.defaultProps.state,
  'absent',
  'banned',
];


const baseSpawner = spRes.makeSpawner(recipe);
const { normalizeProps } = baseSpawner.typeMeta;

async function plan(origSpec) {
  let spec = normalizeProps(origSpec);
  const { state } = spec;
  mustBe([['oneOf', [undefined, ...simpleStates]]], 'state')(state);

  const arrowNotationPresenceMarkers = spec.name.split(/\s+=>\s+/);
  if (arrowNotationPresenceMarkers) {
    const [justName, direct, ...subsequent] = arrowNotationPresenceMarkers;
    if (subsequent.length > 1) {
      throw new Error('Subsequent presence markers are not supported yet.');
    }
    if (direct) {
      mustBe.nest('presenceMarker (via arrow notation in name)', direct);
      const presenceMarker = unwrapSingleKey(0,
        [].concat(spec.presenceMarker, direct).filter(Boolean));
      spec = { presenceMarker, ...spec, name: justName };
    }
  }

  if (spec.name.endsWith('¬')) {
    spec.name = spec.name.slice(0, -1);
    spec.state = 'absent';
  }

  const plaus = plausiblePkgNameRx.exec(spec.name) || false;
  if (plaus[0] !== spec.name) {
    const quoted = JSON.stringify(spec.name);
    throw new Error('Dubious package name, is it real? ' + quoted);
  }

  const res = await baseSpawner(this, spec);
  if (tracePkgNames.includes(spec.name)) {
    const trc = String(res.traceParents().concat(res));
    console.warn('T: debPkg:', trc);
  }
  return res;
}


export default {
  normalizeProps,
  plan,
  recipe,
};
