// -*- coding: utf-8, tab-width: 2 -*-

import pathLib from 'path';
import homeDirTilde from 'ubborg-resolve-homedir-tilde-by-user-plan-pmb';

import spRes from '../resUtil/simplePassiveResource';

import mimeTypeAliases from '../resUtil/file/mimeAlias';
import mimeTypeFx from '../resUtil/file/mimeFx';


async function hatch(initExtras) {
  const res = this;
  const path = res.id;
  if (!path.startsWith('/')) { throw new Error('Path must be absolute!'); }
  const parentDir = pathLib.dirname(path);
  if (parentDir && (parentDir !== '/')) {
    await res.needs('file', { path: parentDir, mimeType: 'dir' });
  }

  const facts = await res.toFactsDict({ acceptPreliminary: true });
  const { targetMimeType } = initExtras.spawnOpt.spec;
  if (targetMimeType) {
    await res.needs('file', { path: facts.content, mimeType: targetMimeType });
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
};

const baseSpawner = spRes.makeSpawner(recipe);
const { normalizeProps } = baseSpawner.typeMeta;


async function plan(origSpec) {
  const ourCtx = this;
  const spec = normalizeProps(origSpec);

  const mtFx = mimeTypeFx[spec.mimeType];
  if (mtFx) { Object.assign(spec, await mtFx.call(this, spec)); }

  const mta = mimeTypeAliases[spec.mimeType];
  if (mta) { spec.mimeType = mta; }

  let { path } = spec;
  if (spec.enforcedOwner && path.startsWith('~')) {
    path = await homeDirTilde(ourCtx, path, spec.enforcedOwner);
  }
  if (path.endsWith('/')) { path = path.slice(0, -1); }

  return baseSpawner(this, {
    ...spec,
    path,
    targetMimeType: undefined,
  }, { spec });
}



export default {
  normalizeProps,
  plan,
};
