// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';
import objPop from 'objpop';
import is from 'typechecks-pmb';
import mustBe from 'typechecks-pmb/must-be';
import goak from 'getoraddkey-simple';
import vTry from 'vtry';
import pImmediate from 'p-immediate';
import joinIdParts from 'ubborg-restype-util-pmb/src/joinIdParts';

import recipeTimeouts from '../recipeTimeouts';
import hook from '../../hook';

import vanillaRecipe from './vanillaRecipe';
import vanillaApi from './vanillaApi';


const typeMetaDictNames = [
  'acceptProps',
  'defaultProps',
  'mergePropsConflictSolvers',
  recipeTimeouts.recipeTmoKey,
];
const typeMetaListNames = [
  'mergePropsPrepareSteps',
  'relationVerbs',
  'uniqueIndexProps',
];
function typeMetaToString() { return `resTypeMeta[${this.name}]`; }


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
    res.hatching = false;
    // console.debug('startHatching', String(res), 'done.');
    return res;
  }
  res.hatching = true;  // see also: .hasHatched() in API
  res.hatchedPr = waitUntilHatched();
  return res;
}


function makeSpawner(recipe) {
  const recPop = objPop(recipe, { mustBe });
  const typeName = recPop.mustBe('nonEmpty str', 'typeName');
  const idProps = recPop.mustBe('nonEmpty ary', 'idProps');

  const api = aMap(vanillaApi, function mergeApi(vani, categ) {
    return { ...vani, ...recPop.ifHas(categ + 'Api') };
  });
  function mustVanil(c, k) { return recPop.mustBe(c, k, vanillaRecipe[k]); }
  const installRelationFuncs = mustVanil('fun', 'installRelationFuncs');
  const forkLinCtxImpl = mustVanil('fun', 'forkLineageContext');

  function normalizeProps(p) {
    // We can't handle arrays of specs here, because spawn() is expected
    // to return a promise for exactly one resource.
    // Thus, the array convenience is reserved for relationVerb functions.
    if (is.dictObj(p)) { return { ...p }; }
    if (is.str(p) && (idProps.length === 1)) { return { [idProps[0]]: p }; }
    throw new Error('Unsupported props format for ' + typeName);
  }

  const typeMeta = (function compileTypeMeta() {
    const tm = {
      name: typeName,
      idProps,
      toString: typeMetaToString,
      normalizeProps,
    };
    function cp(l, c) { l.forEach((k) => { tm[k] = mustVanil(c, k); }); };
    cp(typeMetaListNames, 'ary');
    cp(typeMetaDictNames, 'dictObj');
    return tm;
  }());
  recPop.expectEmpty('Unsupported recipe feature(s)');

  const idJoiner = vTry(joinIdParts, 'construct ID for ' + typeName);

  async function spawn(lineageCtx, origPropSpec, spawnOpt) {
    if (lineageCtx.getTypeMeta) {
      throw new Error("A lineage context shouldn't have a getTypeMeta.");
    }
    const normalizedProps = normalizeProps(origPropSpec);
    const id = idJoiner(idProps, {
      ...typeMeta.defaultProps,
      ...normalizedProps,
    });
    if (idProps.length === 1) { delete normalizedProps[idProps[0]]; }
    const res = {
      typeName,
      id,
      getTypeMeta() { return typeMeta; },
      traceParents: lineageCtx.traceParents,
      customProps: null, // res.incubate() will overwrite this.
      ...api.direct,
      ...lineageCtx.resByUniqueIndexProp.makeTypeApi(typeName),
      spawning: 'really soon now',
    };

    const sameTypePlans = goak(lineageCtx.getResourcesByTypeName(),
      typeName, '{}');
    const dupeOf = sameTypePlans[id];
    if (!dupeOf) { sameTypePlans[id] = res; }

    const initExtras = {
      getRes() { return res; }, // in cases where "this" is inconvenient
      dupeOf,
      getLineageContext() { return lineageCtx; },
      forkLineageContext: forkLinCtxImpl.bind(res, lineageCtx),
      origPropSpec,
      normalizedProps,
      spawnOpt: (spawnOpt || false),
    };
    const makeResMtdTmoProxy = recipeTimeouts.makeResMtdTimeoutProxifier(res);
    Object.assign(res, makeResMtdTmoProxy.mapFuncs(api.promising), {
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
  makeSpawner,
  recipe: vanillaRecipe,
};
