// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';

import copyDependencyFilePropsOnto from './copyDependencyFilePropsOnto.mjs';


const EX = async function maybePlanParentDir(res, path, upgradedSpec) {
  const parDirPath = (pathLib.dirname(path) || '/');
  const facts = await res.toFactsDict({ acceptPreliminary: true });
  if (facts.mimeType === null) {
    // to-be-deleted files don't need a parent directory.
    return;
  }
  if (!facts.mimeType) { throw new Error('Unexpected false-y mimeType!'); }
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
  // console.error('parDirSpec: %o\n-> %o\n', upgradedSpec, parDirSpec);
  copyDependencyFilePropsOnto(upgradedSpec, parDirSpec, []);
  if (parDirSpec.ignoreDepPaths.includes(parDirPath)) { return; }
  await res.needs('file', parDirSpec);
};


export default EX;
