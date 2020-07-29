// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';
import mustBe from 'typechecks-pmb/must-be';
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


const checkSymlinkArrow = (function compile() {
  const when = ' (when used with symlink arrow notation)';
  function und(o, k) { mustBe('undef', k + when)(k[o]); }
  return function chk(spec) {
    const sym = spec.path.split(/\s+=\->\s+/);
    if (sym.length !== 2) { return null; }
    und(spec, 'content');
    und(spec, 'mimeType');
    const [path, content] = sym;
    return { path, content, mimeType: 'inode/symlink' };
  };
}());


async function plan(origSpec) {
  const ourCtx = this;
  const spec = normalizeProps(origSpec);

  Object.assign(spec, checkSymlinkArrow(spec));

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

  function declare(k, v) {
    if (spec[k] === undefined) { spec[k] = v; }
    if (spec[k] === v) { return; }
    throw new Error(`file spec conflict "${k}": "${spec[k]}" != "${v}"`);
  }
  if (spec.targetMimeType) { declare('mimeType', 'inode/symlink'); }
  if (spec.mimeType === 'inode/symlink') {
    if (spec.content) {
      spec.content = ((spec.tgtPathPre || '') + spec.content
        + (spec.tgtPathSuf || ''));
    }
    if ((spec.content || '').endsWith('/')) {
      spec.content = spec.content.slice(0, -1);
      declare('targetMimeType', 'inode/directory');
    }
  }

  if (path.endsWith('/')) {
    if (spec.mimeType === 'inode/symlink') {
      path += pathLib.basename(mustBe.nest('symlink target', spec.content));
    } else {
      path = path.slice(0, -1);
      declare('mimeType', 'inode/directory');
    }
  }
  path = pathLib.normalize(path);

  return baseSpawner(this, {
    ...spec,
    path,
    targetMimeType: undefined,
    pathPre: undefined,
    pathSuf: undefined,
    tgtPathPre: undefined,
    tgtPathSuf: undefined,
    ignoreDepPaths: undefined,
  }, { spec });
}


export default {
  normalizeProps,
  plan,
};
