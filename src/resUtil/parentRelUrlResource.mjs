// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';
import bundleUrlUtil from 'ubborg-bundleurl-util-pmb';

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

  async function spawn(ctx, origSpec, spawnOpt) {
    const normSpec = normalizeProps(origSpec);
    const parent = (mustBe('undef | eeq:false | dictObj',
      typeName + ' parent')(ctx.relatedBy) || false);
    const shortAbsUrl = bundleUrlUtil.shorten(bundleUrlUtil.href(parent.id,
      mustBe.nest(typeName + ' spec', normSpec.url)));
    return baseSpawner(ctx, { ...normSpec, url: shortAbsUrl }, spawnOpt);
  }
  return spawn;
}


export default {
  ...spRes,
  makeSpawner,
};
