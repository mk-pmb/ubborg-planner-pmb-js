// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be';

import iniFile from './iniFile';

function plan(spec) {
  const remain = { ...spec };
  const mustPop = objPop.d(remain, { mustBe }).mustBe;

  const owner = mustPop('undef | nonEmpty str', 'owner');
  const exec = mustPop('false | nonEmpty str', 'title');
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
    path: mustPop('nonEmpty str', 'path'),
    enforcedOwner: owner,
    enforcedGroup: owner,
    enforcedModes: 'a=rx,ug+w',
    ...remain,
    sections: { 'Desktop Entry': entry },
  });
}



export default {
  plan,
};
