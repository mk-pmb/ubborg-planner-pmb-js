// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';
import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be.js';
import usingItsOwnPromise from 'using-its-own-promise-pmb';

import vanillaRecipe from './vanillaRecipe.mjs';
import vanillaApi from './vanillaApi.mjs';

import compileTypeMeta from './compileTypeMeta.mjs';
import spawnResPlan from './spawnResPlan.mjs';


function makeSpawner(recipe) {
  const recPop = objPop(recipe, { mustBe });
  const typeName = recPop.mustBe('nonEmpty str', 'typeName');
  const idProps = recPop.mustBe('nonEmpty ary', 'idProps');

  const api = aMap(vanillaApi, function mergeApi(vani, categ) {
    return { ...vani, ...recPop(categ + 'Api') };
  });
  function mustVanil(c, k) { return recPop.mustBe(c, k, vanillaRecipe[k]); }
  const installRelationFuncs = mustVanil('fun', 'installRelationFuncs');
  const forkLinCtxImpl = mustVanil('fun', 'forkLineageContext');

  const typeMeta = compileTypeMeta(typeName, idProps, mustVanil);
  recPop.expectEmpty('Unsupported recipe feature(s)');

  function spawn(lineageCtx, origPropSpec, spawnOpt) {
    const spawnExtras = {
      typeMeta,
      api,
      lineageCtx,
      origPropSpec,
      spawnOpt,
      forkLinCtxImpl,
      installRelationFuncs,
    };
    return usingItsOwnPromise(spawnResPlan, spawnExtras);
  }
  Object.assign(spawn, { typeMeta });
  return spawn;
}



export default {
  makeSpawner,
  recipe: vanillaRecipe,
};
