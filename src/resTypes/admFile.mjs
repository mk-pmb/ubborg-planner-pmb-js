// -*- coding: utf-8, tab-width: 2 -*-

import preCfg from '../resUtil/preconfiguredResType';
import origResType from './file';

export default preCfg(origResType, {
  enforcedOwner: 'root',
  enforcedGroup: 'adm',
  enforcedModes: 'a-x,a=rX,ug+w', // a-x ensures X only matches directories
});
