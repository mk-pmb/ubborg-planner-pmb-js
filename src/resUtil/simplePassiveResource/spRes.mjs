// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import is from 'typechecks-pmb';
import mustBe from 'typechecks-pmb/must-be';
import goak from 'getoraddkey-simple';
import vTry from 'vtry';

import joinIdParts from '../joinIdParts';
import recipeTimeouts from '../recipeTimeouts';
import hook from '../../hook';

import apiBasics from './apiBasics';
import vanillaRecipe from './vanillaRecipe';


function resToDictKey() { return `${this.typeName}[${this.id}]`; }

function startHatching(res, ...hatchArgs) {
  // console.debug('startHatching', String(res), 'go!');
  async function waitUntilHatched() {
    await res.hatch(...hatchArgs);
    await res.relations.waitForAllSubPlanning();
    res.hatching = false;
    // console.debug('startHatching', String(res), 'done.');
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
  const installRelationFuncs = vanil('installRelationFuncs');
  const makeSubCtx = vanil('makeSubContext');
  const typeMeta = {
    name: typeName,
    idProp,
    defaultProps: recPop.ifHas('defaultProps', {}),
    acceptProps,
    relationVerbs: vanil('relationVerbs'),
    timeoutsSec: recipeTimeouts.copy(vanillaRecipe, vanil),
  };
  recPop.expectEmpty('Unsupported recipe feature(s)');

  function copyProps(orig) {
    if (is.obj(orig)) { return { ...orig }; }
    if (is.str(idProp)) { return { [idProp]: orig }; }
    throw new Error('Unsupported props format for ' + typeName);
  }

  const idJoiner = vTry(joinIdParts, 'construct ID for ' + typeName);

  async function spawn(ctx, origProps) {
    if (ctx.getTypeMeta) {
      throw new Error("A context shouldn't have a getTypeMeta.");
    }
    const props = copyProps(origProps);
    const mergedSameType = goak(ctx.getResourcesByTypeName(), typeName, '{}');
    const popProp = objPop.d(props);
    const id = idJoiner(idProp, popProp);
    const dupeOf = mergedSameType[id];

    const res = {
      typeName,
      id,
      getTypeMeta() { return typeMeta; },
      toString: resToDictKey,
      toDictKey: resToDictKey,
    };
    res.relations = String(res) + ' not ready for relations yet!';

    const makeResMtdTmoProxy = recipeTimeouts.makeResMtdTimeoutProxifier(res);
    Object.assign(res, makeResMtdTmoProxy.mapFuncs(api));

    res.spawning = {
      dupeOf,
      getContext() { return ctx; },
      makeSubContext(changes) { return makeSubCtx.call(res, ctx, changes); },
    };

    async function extendedIncubate() {
      await res.incubate(props);
      if (dupeOf) { return; }

      await res.prepareRelationsManagement();
      installRelationFuncs.call(ctx, res, typeMeta);

      mergedSameType[id] = res;
      await hook(ctx, 'ResourceSpawned', res);
    }
    await makeResMtdTmoProxy('spawning', { impl: extendedIncubate })();
    if (dupeOf) {
      const ack = await dupeOf.mergeUpdate(res);
      if (ack === dupeOf) {
        await hook(ctx, 'ResourceRespawned', dupeOf);
        return dupeOf;
      }
      throw new Error('Unmerged duplicate resource ID for ' + String(res));
    }
    delete res.spawning;

    startHatching(res, props);
    // ^-- Should be awaited by the top-level resource via res.hatchedPr.
    await res.finalizePlan();
    return res;
  }

  Object.assign(spawn, { typeMeta });
  return spawn;
}



export default {
  apiBasics,
  makeSpawner,
  recipe: vanillaRecipe,
};
