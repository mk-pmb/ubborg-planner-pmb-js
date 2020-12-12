// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';

import copyDependencyFilePropsOnto from './copyDependencyFilePropsOnto';


const EX = async function maybePlanTarget(srcRes, srcPath, upgradedSrcSpec) {
  // src = whatever points to the target, usually a symlink.
  const srcFacts = await srcRes.toFactsDict({ acceptPreliminary: true });
  const tgtMime = srcFacts.targetMimeType;
  if (!tgtMime) { return; }
  const srcParentDir = (pathLib.dirname(srcPath) || '/');
  const tgtPathAbs = pathLib.resolve('/proc/ERR_BOGUS_PATH', srcParentDir,
    srcFacts.content);
  await srcRes.declareFacts({
    debugHints: { targetPathResolved: tgtPathAbs },
  });
  const tgtOwnerWithin = upgradedSrcSpec.targetInheritOwnerWithin;
  const tgtSpec = {
    path: tgtPathAbs,
    mimeType: tgtMime,
    debugHints: { via: { [srcPath]: 'targetMimeTypeOf' } },
    inheritOwnerWithin: tgtOwnerWithin,
  };
  copyDependencyFilePropsOnto({
    ...upgradedSrcSpec,
    inheritOwnerWithin: tgtOwnerWithin,
  }, tgtSpec, [srcPath, srcParentDir]);
  // console.error('maybePlanTarget: %o\n-> %o\n', upgradedSrcSpec, tgtSpec);
  await srcRes.needs('file', tgtSpec);
};


export default EX;
