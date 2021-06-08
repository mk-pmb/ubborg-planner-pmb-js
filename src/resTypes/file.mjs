// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';
import mustBe from 'typechecks-pmb/must-be';
import homeDirTilde from 'ubborg-resolve-homedir-tilde-by-user-plan-pmb';
import getOwn from 'getown';

import spRes from '../resUtil/simplePassiveResource/index.mjs';

import mimeTypeFx from '../resUtil/file/mimeFx.mjs';
import mtAlias from '../resUtil/file/mimeAlias.mjs';
import checkInheritOwnerWithin
  from '../resUtil/file/checkInheritOwnerWithin.mjs';
import checkSymlinkArrow from '../resUtil/file/checkSymlinkArrow.mjs';
import maybePlanParentDir from '../resUtil/file/maybePlanParentDir.mjs';
import maybePlanTarget from '../resUtil/file/maybePlanTarget.mjs';
import simpleNonMagicProps from '../resUtil/file/simpleNonMagicProps.mjs';
import propConflictSolvers from '../resUtil/file/propConflictSolvers.mjs';

const {
  sym: mtSym,
  dir: mtDir,
} = mtAlias;


async function hatch(initExtras) {
  const res = this;
  const path = decodeURIComponent(res.id);
  if (!path.startsWith('/')) { throw new Error('Path must be absolute!'); }

  const { upgradedSpec } = initExtras.spawnOpt;
  await maybePlanParentDir(res, path, upgradedSpec);
  await maybePlanTarget(res, path, upgradedSpec);
}


const recipe = {
  typeName: 'file',
  idProps: ['path'],
  defaultProps: {
    mimeType: '*/*',  // NB aliases.
  },
  acceptProps: {
    replace: 'bool',
    backupDir: 'nonEmpty str',
    mimeType: 'nul | nonEmpty str',
    targetMimeType: 'nonEmpty str',

    ...mustBe.tProp(null, simpleNonMagicProps, 'dictObj', 'allResProps'),

    content: true,
    verifyContent: true,
    uploadFromLocalPath: 'bool | nonEmpty str',
    // ^-- absolute, or "true" = same as "path" prop
    downloadUrls: true,
    [checkInheritOwnerWithin.scopeKey]: 'nul | nonEmpty str',
    [checkInheritOwnerWithin.tgtScopeKey]: 'nul | nonEmpty str',
  },
  promisingApi: {
    hatch,
    finalizePlan() { return this.hatchedPr; },
  },
  mergePropsConflictSolvers: {
    ...spRes.recipe.mergePropsConflictSolvers,
    ...propConflictSolvers,
  },
};

const baseSpawner = spRes.makeSpawner(recipe);
const { normalizeProps } = baseSpawner.typeMeta;


async function plan(origSpec) {
  const ourCtx = this;
  const spec = normalizeProps(origSpec);

  spec.path = ((spec.pathPre || '')
    + (spec.path || '')
    // ^-- It's perfectly valid to construct the path from just …Pre or …Suf.
    + (spec.pathSuf || ''));
  delete spec.pathPre;
  delete spec.pathSuf;
  checkSymlinkArrow.updateInplace(spec);
  checkInheritOwnerWithin.updateInplace(spec);

  let { path } = spec; // Unpack only after the inplace updates are applied.
  if (spec.enforcedOwner && path.startsWith('~')) {
    path = await homeDirTilde(ourCtx, path, spec.enforcedOwner);
  }

  function mtTranslateAlias(k, d) { spec[k] = getOwn(d, spec[k], spec[k]); }

  if (spec.mimeType === null) {
    // File shall not exist => ignore props that are thus useless.
    // This way file existence can easily be toggled without having to
    // fork logic at each pre-configure level (e.g. admFile, userFile).
    const useless = [
      ...Object.keys(simpleNonMagicProps.uselessOnAbsentFiles),
    ];
    useless.forEach(function drop(p) { delete spec[p]; });
  }
  if (spec.mimeType) {
    const mtFx = getOwn(mimeTypeFx, spec.mimeType.split(/;/)[0]);
    if (mtFx) { Object.assign(spec, await mtFx.call(this, spec)); }
    mtTranslateAlias('mimeType', mtAlias);
  }

  function declare(k, v) {
    if (spec[k] === undefined) { spec[k] = v; }
    if (spec[k] === v) { return; }
    throw new Error(`file spec conflict "${k}": "${spec[k]}" != "${v}"`);
  }
  if (spec.targetPathPre || spec.targetPathSuf) { declare('mimeType', mtSym); }
  if (spec.targetMimeType) {
    declare('mimeType', mtSym);
    mtTranslateAlias('targetMimeType', mtAlias);
  }
  if (spec.mimeType === mtSym) {
    if (spec.content) {
      spec.content = ((spec.targetPathPre || '') + spec.content
        + (spec.targetPathSuf || ''));
    }
    if ((spec.content || '').endsWith('/')) {
      spec.content = spec.content.replace(/\/+$/, '');
      declare('targetMimeType', mtDir);
    }
    const tgtUpd = checkInheritOwnerWithin({
      path: spec.content,
      [checkInheritOwnerWithin.scopeKey + 'RelativeTo']: path,
    });
    // console.error('from inhOwn:', { path, content: spec.content, tgtUpd });
    if (tgtUpd) {
      spec.content = tgtUpd.path;
      declare(checkInheritOwnerWithin.tgtScopeKey,
        tgtUpd[checkInheritOwnerWithin.scopeKey]);
    }
  }

  mustBe.nest('effective path', path);
  if (path.endsWith('/')) {
    if (spec.mimeType === mtSym) {
      path += pathLib.basename(mustBe.nest('symlink target', spec.content));
    } else {
      path = path.replace(/\/+$/, '');
      declare('mimeType', mtDir);
    }
  }
  path = pathLib.normalize(path);

  return baseSpawner(this, {
    ...spec,
    path,
    ignoreDepPaths: undefined,
    targetPathPre: undefined,
    targetPathSuf: undefined,
    [checkInheritOwnerWithin.scopeKey]: undefined,
    [checkInheritOwnerWithin.tgtScopeKey]: undefined,
  }, { upgradedSpec: spec });
}


export default {
  normalizeProps,
  plan,
};
