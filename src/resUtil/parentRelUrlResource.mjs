// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';
import buu from 'ubborg-bundleurl-util-pmb';

import spRes from './simplePassiveResource';


function makeSpawner(recipe) {
  const { typeName, idProps } = recipe;
  if ((idProps.length !== 1) || (idProps[0] !== 'url')) {
    const err = ('For "' + typeName + ' to be a parentRelUrlResource, '
      + 'its recipe must have exactly one idProp, called "url".');
    throw new Error(err);
  }

  const baseSpawner = spRes.makeSpawner(recipe);
  const { normalizeProps } = baseSpawner.typeMeta;

  async function spawn(ctx, origSpec, origSpawnOpt) {
    const parent = (mustBe('undef | eeq:false | dictObj',
      typeName + ' parent')(ctx.relatedBy) || false);
    const normSpec = normalizeProps(origSpec);
    const subHref = mustBe.nest(typeName + ' url', normSpec.url);
    let spawnOpt = origSpawnOpt;
    let baseUrl = buu.href(parent.id);
    const trail = (spawnOpt || false).ensureParentUrlTrail;
    if (trail) {
      spawnOpt = { ...origSpawnOpt };
      delete spawnOpt.ensureParentUrlTrail;
      if (!baseUrl.endsWith(trail)) { baseUrl += trail; }
    }
    const shortAbsSubUrl = buu.shorten(buu.href(baseUrl, subHref));
    return baseSpawner(ctx, { ...normSpec, url: shortAbsSubUrl }, spawnOpt);
  }
  return spawn;
}


export default {
  ...spRes,
  recipe: {
    ...spRes.recipe,
    idProps: ['url'],
  },
  makeSpawner,
};
