// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';
import homeDirTilde from 'ubborg-resolve-homedir-tilde-by-user-plan-pmb';

import spRes from '../resUtil/simplePassiveResource';

import mimeTypeAliases from '../resUtil/file/mimeAlias';
import mimeTypeFx from '../resUtil/file/mimeFx';


function listHas(l, x) { return l && l.includes(x); }
function concatIf(a, b) { return (a ? a.concat(b) : b); }


async function hatch(initExtras) {
  const res = this;
  const path = res.id;
  if (!path.startsWith('/')) { throw new Error('Path must be absolute!'); }

  const origSpec = initExtras.spawnOpt.spec;
  const ignoreDepPaths = concatIf(origSpec.ignoreDepPaths, [path]);

  const parentDir = (pathLib.dirname(path) || '/');
  if (parentDir !== '/') {
    if (!listHas(ignoreDepPaths, parentDir)) {
      await res.needs('file', { path: parentDir + '/', ignoreDepPaths });
    }
  }

  const facts = await res.toFactsDict({ acceptPreliminary: true });
  const { targetMimeType } = origSpec;
  if (targetMimeType) {
    const tgtAbs = pathLib.resolve('/proc/ERR_BOGUS_PATH',
      parentDir, facts.content);
    const flinch = ((tgtAbs === parentDir)
      || listHas(ignoreDepPaths, tgtAbs));
    // console.error(path, 'tmt? ->', tgtAbs, ignoreDepPaths, parentDir);
    if (!flinch) {
      await res.needs('file', {
        path: tgtAbs,
        mimeType: targetMimeType,
        ignoreDepPaths,
      });
    }
  }
}


const recipe = {
  typeName: 'file',
  idProps: ['path'],
  defaultProps: {
    mimeType: '*/*',  // null = no such file should exist. NB aliases above.
  },
  acceptProps: {
    replace: true,
    backupDir: true,

    // If the file is to be created:
    createdOwner: true,
    createdGroup: true,
    createdModes: true,

    // In case the file existed already:
    enforcedOwner: true,
    enforcedGroup: true,
    enforcedModes: true,

    content: true,
    verifyContent: true,
    uploadFromLocalPath: true,  // absolute, or "true" = same as "path" prop
    downloadUrls: true,
  },
  promisingApi: {
    hatch,
    finalizePlan() { return this.hatchedPr; },
  },
  mergePropsConflictSolvers: {
    ...spRes.recipe.mergePropsConflictSolvers,
    mimeType(orig, upd) {
      const [a, b] = [orig, upd].sort();
      if (a === 'inode/directory') {
        if (b === 'inode/symlink') { return b; }
      }
    },
  },
};

const baseSpawner = spRes.makeSpawner(recipe);
const { normalizeProps } = baseSpawner.typeMeta;


async function plan(origSpec) {
  const ourCtx = this;
  const spec = normalizeProps(origSpec);
  const suggest = {};

  if (spec.mimeType) {
    const mtFx = mimeTypeFx[spec.mimeType.split(/;/)[0]];
    if (mtFx) { Object.assign(spec, await mtFx.call(this, spec)); }
    const mta = mimeTypeAliases[spec.mimeType];
    if (mta) { spec.mimeType = mta; }
  }

  let path = (spec.pathPre || '') + spec.path + (spec.pathSuf || '');
  if (spec.enforcedOwner && path.startsWith('~')) {
    path = await homeDirTilde(ourCtx, path, spec.enforcedOwner);
  }
  if (path.endsWith('/')) {
    path = path.slice(0, -1);
    suggest.mimeType = 'inode/directory';
  }

  if (spec.targetMimeType) { suggest.mimeType = 'inode/symlink'; }

  return baseSpawner(this, {
    ...suggest,
    ...spec,
    path,
    targetMimeType: undefined,
    pathPre: undefined,
    pathSuf: undefined,
    ignoreDepPaths: undefined,
  }, { spec });
}


export default {
  normalizeProps,
  plan,
};
