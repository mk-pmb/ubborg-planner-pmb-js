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
  const baseSpawner = spRes.makeSpawner(recipe);

  async function spawn(ctx, origSpec) {
    let path = mustBe.nest(typeName + ' spec', origSpec);
    const parent = ctx.requestedBy;
    if (parent) {
      parentMustBeObj(parent);
      const parentBaseDir = mustBe.nest(typeName + ' parent basedir',
        parent.props.basedir);
      path = normJoinPath(parentBaseDir, path);
    }
    const res = await baseSpawner(ctx, { path });
    res.props.basedir = findBaseDir(path);
    return res;
  }
  return spawn;
}


export default {
  makeSpawner,
};
