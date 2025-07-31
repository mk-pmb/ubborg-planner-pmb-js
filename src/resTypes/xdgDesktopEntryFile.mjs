// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be.js';
import homeDirTilde from 'ubborg-resolve-homedir-tilde-by-user-plan-pmb';
import toSnakeCase from 'lodash.snakecase';

import file from './file.mjs';

async function plan(spec, ...extras) {
  const ourCtx = this;
  const remain = { ...spec };
  const mustPop = objPop.d(remain, { mustBe }).mustBe;

  const owner = mustPop('undef | nonEmpty str', 'owner');
  const path = mustPop('nonEmpty str', 'path');
  const Exec = mustPop('fal | nonEmpty str', 'exec');
  const entry = {
    ...(Exec && {
      Encoding: 'UTF-8',
      Version: '0.9.4',
      Type: 'Application',
      Name: mustPop('nonEmpty str', 'title'),
      Comment: mustPop('str', 'descr', ''),
      Icon: mustPop('str', 'icon', ''),
      Exec,
      StartupNotify: false,
      Terminal: false,
    }),
    Hidden: String(!Exec),
    ...mustPop('undef | dictObj', 'entry'),
  };

  const fileSpec = {
    path: await homeDirTilde(ourCtx, path, spec),
    enforcedOwner: owner,
    enforcedGroup: owner,
    enforcedModes: [
      'a=r',
      'ug+w',
      (Exec && 'a+x'),
    ].filter(Boolean).join(','),
    mimeType: 'static_ini',
    ...remain,
    content: { 'Desktop Entry': entry },
  };
  return file.plan.call(this, fileSpec, ...extras);
}


function inDir(basedir) {
  function planInBaseDir(origSpec) {
    let { bfn } = origSpec;
    if (bfn === undefined) {
      const { title } = origSpec;
      mustBe.nest('At least one of props "title" and "bfn"', title);
      bfn = toSnakeCase(title);
    }
    mustBe.nest('bfn (base filename) prop, if given', bfn);
    const path = `${basedir}/${bfn}.desktop`;
    const spec = {
      ...origSpec,
      bfn: undefined,
      path,
    };
    return plan.call(this, spec);
  }
  return planInBaseDir;
}



export default {
  inDir,
  plan,
};
