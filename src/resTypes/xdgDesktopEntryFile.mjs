// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be';
import homeDirTilde from 'ubborg-resolve-homedir-tilde-by-user-plan-pmb';

import iniFile from './iniFile';

async function plan(spec) {
  const ourCtx = this;
  const remain = { ...spec };
  const mustPop = objPop.d(remain, { mustBe }).mustBe;

  const owner = mustPop('undef | nonEmpty str', 'owner');
  const path = mustPop('nonEmpty str', 'path');
  const exec = mustPop('fal | nonEmpty str', 'exec');
  const entry = {
    ...(exec && {
      Encoding: 'UTF-8',
      Version: '0.9.4',
      Type: 'Application',
      Name: mustPop('nonEmpty str', 'title'),
      Comment: mustPop('str', 'descr', ''),
      StartupNotify: false,
      Terminal: false,
    }),
    Hidden: String(!exec),
    ...mustPop('undef | dictObj', 'entry'),
  };

  return iniFile.plan.call(this, {
    path: await homeDirTilde(ourCtx, path, owner),
    ...remain,
    fileOpts: {
      enforcedOwner: owner,
      enforcedGroup: owner,
      enforcedModes: 'a=rx,ug+w',
      ...remain.fileOpts,
    },
    sections: { 'Desktop Entry': entry },
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
