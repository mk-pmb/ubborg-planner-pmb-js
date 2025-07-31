// -*- coding: utf-8, tab-width: 2 -*-

import preCfg from 'ubborg-restype-util-pmb/src/preconfiguredResType.mjs';

import origResType from './file.mjs';

export default preCfg(origResType, {
  enforcedOwner: 'root',
  enforcedGroup: 'adm',
  enforcedModes: 'a-x,a=rX,ug+w', // a-x ensures X only matches directories
  mimeType: 'lines',
});
