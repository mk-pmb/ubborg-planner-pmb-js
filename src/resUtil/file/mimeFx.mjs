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

  lines(spec) {
    return {
      mimeType: 'text/plain; charset=UTF-8',
      content: spec.content.map(ln => ln + '\n'),
    };
  },

  utf8_tw(spec) {
    let [, tw, pre] = spec.mimeType.split(/; */);
    pre = (pre ? ' ' + pre : '');
    if (tw === undefined) { tw = 2; }
    tw = ((+tw || 0) > 0 ? ', tab-width: ' + tw : '');
    const header = pre + '-*- coding: utf-8' + tw + ' -*-';
    return mtFx.lines({ content: [header].concat(spec.content) });
  },

};




export default mtFx;
