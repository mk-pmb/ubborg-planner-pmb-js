// -*- coding: utf-8, tab-width: 2 -*-

import file from './file';


function planAdmFile(spec) {
  return file.plan.call(this, {
    weakOwner: 'root',
    weakGroup: 'adm',
    weakModes: '0664',
    ...spec,
  });
}



export default {
  plan: planAdmFile,
};
