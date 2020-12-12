// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';

import copyDependencyFilePropsOnto from './copyDependencyFilePropsOnto';


const EX = async function maybePlanParentDir(res, path, upgradedSpec) {
  const parDirPath = (pathLib.dirname(path) || '/');
  if (parDirPath === '/') { return; }
  if (parDirPath === path) {
    // Shouldn't actually be possible except for root directory.
    return;
  }
  const parDirSpec = {
    path: parDirPath,
    mimeType: 'dir',
    debugHints: { via: { [path]: 'parentDirOf' } },
  };
  copyDependencyFilePropsOnto(upgradedSpec, parDirSpec, []);
  // console.error('parDirSpec: %o\n-> %o\n', upgradedSpec, parDirSpec);
  if (parDirSpec.ignoreDepPaths.includes(parDirPath)) { return; }
  await res.needs('file', parDirSpec);
};


export default EX;
