// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be';
import homeDirTilde from 'ubborg-resolve-homedir-tilde-by-user-plan-pmb';

import admFile from './admFile';

async function plan(spec) {
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
      Exec,
      StartupNotify: false,
      Terminal: false,
    }),
    Hidden: String(!Exec),
    ...mustPop('undef | dictObj', 'entry'),
  };

  return admFile.plan.call(this, {
    path: await homeDirTilde(ourCtx, path, owner),
    enforcedOwner: owner,
    enforcedGroup: owner,
    enforcedModes: 'a=rx,ug+w',
    mimeType: 'static_ini',
    ...remain,
    content: { 'Desktop Entry': entry },
  });
}


function inDir(basedir) {
  function planInBaseDir(spec) {
    const { bfn } = spec;
    mustBe.nest('bfn (base filename) prop', bfn);
    return plan.call(this, {
      ...spec,
      bfn: undefined,
      path: `${basedir}/${bfn}.desktop`,
    });
  }
  return planInBaseDir;
}



export default {
  inDir,
  plan,
};
