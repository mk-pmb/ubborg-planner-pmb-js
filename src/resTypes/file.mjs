// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';
import mustBe from 'typechecks-pmb/must-be';
import homeDirTilde from 'ubborg-resolve-homedir-tilde-by-user-plan-pmb';
import getOwn from 'getown';

import spRes from '../resUtil/simplePassiveResource';

import mimeTypeFx from '../resUtil/file/mimeFx';
import mtAlias from '../resUtil/file/mimeAlias';

const {
  sym: mtSym,
  dir: mtDir,
} = mtAlias;

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
      if (a === mtDir) {
        if (b === mtSym) { return b; }
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
    return { path, content, mimeType: mtSym };
  };
}());


async function plan(origSpec) {
  const ourCtx = this;
  const spec = normalizeProps(origSpec);

  Object.assign(spec, checkSymlinkArrow(spec));
  function checkAlias(k, d) { spec[k] = getOwn(d, spec[k], spec[k]); }

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
      spec.content = spec.content.slice(0, -1);
      declare('targetMimeType', mtDir);
    }
  }

  if (path.endsWith('/')) {
    if (spec.mimeType === mtSym) {
      path += pathLib.basename(mustBe.nest('symlink target', spec.content));
    } else {
      path = path.slice(0, -1);
      declare('mimeType', mtDir);
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
