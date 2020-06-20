// -*- coding: utf-8, tab-width: 2 -*-

import normJoinPath from 'norm-join-path';
import mustBe from 'typechecks-pmb/must-be';

import spRes from './simplePassiveResource';


function findBaseDir(path) {
  return (path.replace(/\/+[\x00-.0-\uFFFF]*$/, '') || '.');
}


function makeSpawner(recipe) {
  const { typeName, idProps } = recipe;
  if ((idProps.length !== 1) || (idProps[0] !== 'path')) {
    const err = ('For "' + typeName + ' to be a parentRelPathResource, '
      + 'its recipe must have exactly one idProp, called "path".');
    throw new Error(err);
  }

  const parentMustBeObj = mustBe('dictObj', typeName + ' parent');
  const origApi = recipe.promisingApi;
  const origFin = mustBe.fun("The base type's finalizePlan function",
    (origApi || false).finalizePlan);
  const baseSpawner = spRes.makeSpawner({
    ...recipe,
    promisingApi: {
      ...origApi,
      finalizePlan(...args) {
        this.customProps.basedir = findBaseDir(this.id);
        return origFin.apply(this, args);
      },
    },
  });

  const { normalizeProps } = baseSpawner.typeMeta;

  async function spawn(ctx, origSpec, spawnOpt) {
    const normSpec = normalizeProps(origSpec);
    let path = mustBe.nest(typeName + ' spec', normSpec.path);
    const parent = ctx.relatedBy;
    if (parent) {
      parentMustBeObj(parent);
      const parentBaseDir = mustBe.nest(typeName + ' parent basedir',
        parent.customProps.basedir);
      path = normJoinPath(parentBaseDir, path);
    }
    return baseSpawner(ctx, { ...normSpec, path }, spawnOpt);
  }
  return spawn;
}


export default {
  ...spRes,
  makeSpawner,
};
