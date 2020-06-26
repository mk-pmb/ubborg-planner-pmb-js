// -*- coding: utf-8, tab-width: 2 -*-

import dictOfDictsToIniLines from 'dict-of-dicts-to-ini-lines-pmb';

const mtFx = {

  static_ini(spec) {
    return {
      content: dictOfDictsToIniLines(spec.content, {
        eol: '\n',
        translateValues: {
          'false': 'no',
          'true': 'yes',
        },
        ...spec.iniOpt,
      }),
      mimeType: 'text/plain',
      iniOpt: undefined,
    };
  },

};




export default mtFx;
