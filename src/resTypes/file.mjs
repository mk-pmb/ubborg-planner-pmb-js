// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';
import mustBe from 'typechecks-pmb/must-be';
import homeDirTilde from 'ubborg-resolve-homedir-tilde-by-user-plan-pmb';
import getOwn from 'getown';

import spRes from '../resUtil/simplePassiveResource';

import mimeTypeFx from '../resUtil/file/mimeFx';
import mtAlias from '../resUtil/file/mimeAlias';
import checkSymlinkArrow from '../resUtil/file/checkSymlinkArrow';
import simpleNonMagicProps from '../resUtil/file/simpleNonMagicProps';
import propConflictSolvers from '../resUtil/file/propConflictSolvers';

const {
  sym: mtSym,
  dir: mtDir,
} = mtAlias;

function listHas(l, x) { return l && l.includes(x); }
function concatIf(a, b) { return (a ? a.concat(b) : b); }


async function hatch(initExtras) {
  const res = this;
  const path = decodeURIComponent(res.id);
  if (!path.startsWith('/')) { throw new Error('Path must be absolute!'); }

  const { spec } = initExtras.spawnOpt;
  const ignoreDepPaths = concatIf(spec.ignoreDepPaths, [path]);

  const parentDir = (pathLib.dirname(path) || '/');
  if (parentDir !== '/') {
    if (!listHas(ignoreDepPaths, parentDir)) {
      await res.needs('file', {
        path: parentDir + '/',
        debugHints: { via: { [path]: 'parentDirOf' } },
        ignoreDepPaths,
      });
    }
  }

  const facts = await res.toFactsDict({ acceptPreliminary: true });
  const { targetMimeType } = facts;
  if (targetMimeType) {
    const tgtAbs = pathLib.resolve('/proc/ERR_BOGUS_PATH',
      parentDir, facts.content);
    await res.declareFacts({ debugHints: { targetPath: tgtAbs } });
    const flinch = ((tgtAbs === parentDir)
      || listHas(ignoreDepPaths, tgtAbs));
    // console.error(path, 'tmt? ->', tgtAbs, ignoreDepPaths, parentDir);
    if (!flinch) {
      await res.needs('file', {
        path: tgtAbs,
        mimeType: targetMimeType,
        debugHints: { via: { [path]: 'targetMimeTypeOf' } },
        ignoreDepPaths,
      });
    }
  }
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

    ...simpleNonMagicProps.all,

    content: true,
    verifyContent: true,
    uploadFromLocalPath: 'bool | nonEmpty str',
    // ^-- absolute, or "true" = same as "path" prop
    downloadUrls: true,
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

  Object.assign(spec, checkSymlinkArrow(spec));
  function checkAlias(k, d) { spec[k] = getOwn(d, spec[k], spec[k]); }

  if (spec.mimeType === null) {
    // File shall not exist => ignore props that are thus useless.
    // This way file existence can easily be toggled without having to
    // fork logic at each pre-configure level (e.g. admFile, userFile).
    const useless = [
      ...Object.keys(simpleNonMagicProps.accessProps),
    ];
    useless.forEach(function drop(p) { delete spec[p]; });
  }
  if (spec.mimeType) {
    const mtFx = getOwn(mimeTypeFx, spec.mimeType.split(/;/)[0]);
    if (mtFx) { Object.assign(spec, await mtFx.call(this, spec)); }
    checkAlias('mimeType', mtAlias);
  }

  let path = (spec.pathPre || '') + spec.path + (spec.pathSuf || '');
  if (spec.enforcedOwner && path.startsWith('~')) {
    path = await homeDirTilde(ourCtx, path, spec.enforcedOwner);
  }

  function declare(k, v) {
    if (spec[k] === undefined) { spec[k] = v; }
    if (spec[k] === v) { return; }
    throw new Error(`file spec conflict "${k}": "${spec[k]}" != "${v}"`);
  }
  if (spec.tgtPathPre || spec.tgtPathSuf) { declare('mimeType', mtSym); }
  if (spec.targetMimeType) {
    declare('mimeType', mtSym);
    checkAlias('targetMimeType', mtAlias);
  }
  if (spec.mimeType === mtSym) {
    if (spec.content) {
      spec.content = ((spec.tgtPathPre || '') + spec.content
        + (spec.tgtPathSuf || ''));
    }
    if ((spec.content || '').endsWith('/')) {
      spec.content = spec.content.replace(/\/+$/, '');
      declare('targetMimeType', mtDir);
    }
  }

  if (path.endsWith('/')) {
    if (spec.mimeType === mtSym) {
      path += pathLib.basename(mustBe.nest('symlink target', spec.content));
    } else {
      path = path.replace(/\/+$/, '');
      declare('mimeType', mtDir);
    }
  }
  path = pathLib.normalize(path);

  // (function copyDebugHints() {
  //   const dbh = {};
  //   const props = [
  //   ];
  //   props.forEach((p) => {
  //     const v = spec[p];
  //     if (v !== undefined) { dbh[p] = v; }
  //   });
  //   if (Object.keys(dbh).length) {
  //     spec.debugHints = { ...spec.debugHints, ...dbh };
  //   }
  // }());

  return baseSpawner(this, {
    ...spec,
    path,
    ignoreDepPaths: undefined,
    pathPre: undefined,
    pathSuf: undefined,
    tgtPathPre: undefined,
    tgtPathSuf: undefined,
  }, { spec });
}


export default {
  normalizeProps,
  plan,
};
