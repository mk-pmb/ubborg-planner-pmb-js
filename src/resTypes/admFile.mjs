// -*- coding: utf-8, tab-width: 2 -*-

import file from './file';


function planAdmFile(spec) {
  return file.plan.call(this, {
    enforcedOwner: 'root',
    enforcedGroup: 'adm',
    enforcedModes: 'a=r,ug+w',
    ...spec,
  });
}



export default {
  plan: planAdmFile,
};
