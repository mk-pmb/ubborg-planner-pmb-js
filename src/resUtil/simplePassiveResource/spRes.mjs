// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import is from 'typechecks-pmb';
import mustBe from 'typechecks-pmb/must-be';
import goak from 'getoraddkey-simple';
import vTry from 'vtry';
import pImmediate from 'p-immediate';

import joinIdParts from '../joinIdParts';
import recipeTimeouts from '../recipeTimeouts';
import hook from '../../hook';

import apiBasics from './apiBasics';
import vanillaRecipe from './vanillaRecipe';


function resToDictKey() { return `${this.typeName}[${this.id}]`; }
function recPopMustBe(k, c, d) { return mustBe(c, k)(this.ifHas(k, d)); };


function startHatching(res, ...hatchArgs) {
  // console.debug('startHatching', String(res), 'go!');
  async function waitUntilHatched() {
    // Promising funcs are executed immediately, to save overhead in cases
    // where they don't need to wait for anything. The "always defer" rule
    // only applies to chaining (.then). Thus, our first action is to
    // explicitly suspend, to ensure that .hatch will have .hatchedPr
    // available in case it needs it.
    await pImmediate();
    if (!res.hatchedPr) { throw new Error('Still no .hatchedPr?!'); }
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
  recPop.mustBe = recPopMustBe;
  const typeName = recPop.mustBe('typeName', 'nonEmpty str');
  const idProps = recPop.mustBe('idProps', 'nonEmpty ary');

  const api = { ...apiBasics, ...recPop.ifHas('api') };
  function vanil(k) { return recPop.ifHas(k, vanillaRecipe[k]); }
  const installRelationFuncs = vanil('installRelationFuncs');
  const forkLinCtxImpl = vanil('forkLineageContext');
  const typeMeta = (function compileTypeMeta() {
    const tm = {
      name: typeName,
      idProps,
      relationVerbs: vanil('relationVerbs'),
      timeoutsSec: recipeTimeouts.copy(vanillaRecipe, vanil),
    };
    function cp(k, c, d) { tm[k] = recPop.mustBe(k, c, d); }
    cp('defaultProps', 'obj', {});
    cp('acceptProps', 'obj', {});
    cp('uniqueIndexProps', 'ary', []);
    return tm;
  }());
  recPop.expectEmpty('Unsupported recipe feature(s)');

  function normalizeProps(p) {
    if (is.obj(p)) { return { ...p }; }
    if (is.str(p) && (idProps.length === 1)) { return { [idProps[0]]: p }; }
    throw new Error('Unsupported props format for ' + typeName);
  }

  const idJoiner = vTry(joinIdParts, 'construct ID for ' + typeName);

  async function spawn(lineageCtx, origProps, spawnOpt) {
    if (lineageCtx.getTypeMeta) {
      throw new Error("An lineage context shouldn't have a getTypeMeta.");
    }
    const normalizedProps = normalizeProps(origProps);
    const id = idJoiner(idProps, {
      ...typeMeta.defaultProps,
      ...normalizedProps,
    });
    if (idProps.length === 1) { delete normalizedProps[idProps]; }
    const res = {
      typeName,
      id,
      getTypeMeta() { return typeMeta; },
      toString: resToDictKey,
      toDictKey: resToDictKey,
      ...lineageCtx.resByUniqueIndexProp.makeTypeApi(typeName),
      spawning: 'really soon now',
    };

    const sameTypePlans = goak(lineageCtx.getResourcesByTypeName(),
      typeName, '{}');
    const dupeOf = sameTypePlans[id];
    if (!dupeOf) { sameTypePlans[id] = res; }

    const initExtras = {
      dupeOf,
      getLineageContext() { return lineageCtx; },
      forkLineageContext: forkLinCtxImpl.bind(res, lineageCtx),
      props: normalizedProps,
      origProps,
      spawnOpt: (spawnOpt || false),
    };
    const makeResMtdTmoProxy = recipeTimeouts.makeResMtdTimeoutProxifier(res);
    Object.assign(res, makeResMtdTmoProxy.mapFuncs(api), {
      relations: String(res) + ' not ready for relations yet!',
      spawning: initExtras,
    });

    async function extendedIncubate() {
      await res.incubate(normalizedProps);
      if (dupeOf) { return; }
      await res.prepareRelationsManagement();
      installRelationFuncs.call(lineageCtx, res, typeMeta);
      await hook(lineageCtx, 'ResourceSpawned', res);
    }
    await makeResMtdTmoProxy('spawning', { impl: extendedIncubate })();
    if (dupeOf) {
      const ack = await dupeOf.mergeUpdate(res);
      if (ack === dupeOf) {
        await hook(lineageCtx, 'ResourceRespawned', dupeOf);
        return dupeOf;
      }
      throw new Error('Unmerged duplicate resource ID for ' + String(res));
    }
    delete res.spawning;

    startHatching(res, initExtras);
    // ^-- Should be awaited by the top-level resource via res.hatchedPr.
    await res.finalizePlan(initExtras);
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
