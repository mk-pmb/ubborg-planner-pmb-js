// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';

import copyDependencyFilePropsOnto from './copyDependencyFilePropsOnto';
import chkInhOwn from './checkInheritOwnerWithin';


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
  const tgtOwnerWithin = {
    [chkInhOwn.scopeKey]: upgradedSrcSpec[chkInhOwn.tgtScopeKey],
  };
  const tgtSpec = {
    path: tgtPathAbs,
    mimeType: tgtMime,
    debugHints: { via: { [srcPath]: 'targetMimeTypeOf' } },
    ...tgtOwnerWithin,
  };
  copyDependencyFilePropsOnto({
    ...upgradedSrcSpec,
    ...tgtOwnerWithin,
    [chkInhOwn.scopeKey + 'RelativeTo']: srcPath,
  }, tgtSpec, [srcPath, srcParentDir]);
  // console.error('maybePlanTarget: %o\n-> %o\n', upgradedSrcSpec, tgtSpec);
  await srcRes.needs('file', tgtSpec);
};


export default EX;
