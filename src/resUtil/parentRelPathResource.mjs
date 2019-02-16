// -*- coding: utf-8, tab-width: 2 -*-

import normJoinPath from 'norm-join-path';
import mustBe from 'typechecks-pmb/must-be';

import spRes from './simplePassiveResource';


function findBaseDir(path) {
  return (path.replace(/\/+[\x00-.0-\uFFFF]*$/, '') || '.');
}


function makeSpawner(recipe) {
  const { typeName } = recipe;
  const parentMustBeObj = mustBe('obj', typeName + ' parent');
  const origApi = recipe.api;
  const origFin = (origApi || false).finalizePlan;
  if (!origFin) {
    console.log(recipe);
    throw new Error('no origFin!');
  }
  const baseSpawner = spRes.makeSpawner({
    ...recipe,
    api: {
      ...origApi,
      finalizePlan(...args) {
        this.props.basedir = findBaseDir(this.id);
        return origFin.apply(this, args);
      },
    },
  });

  async function spawn(ctx, origSpec) {
    let path = mustBe.nest(typeName + ' spec', origSpec);
    const parent = ctx.relatedBy;
    if (parent) {
      parentMustBeObj(parent);
      const parentBaseDir = mustBe.nest(typeName + ' parent basedir',
        parent.props.basedir);
      path = normJoinPath(parentBaseDir, path);
    }
    return baseSpawner(ctx, { path });
  }
  return spawn;
}


export default {
  ...spRes,
  makeSpawner,
};
