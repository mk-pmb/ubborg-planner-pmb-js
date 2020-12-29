// -*- coding: utf-8, tab-width: 2 -*-

import dictOfDictsToIniLines from 'dict-of-dicts-to-ini-lines-pmb';
import qryStr from 'qrystr';
import getOwn from 'getown';
import yamlify from 'yamlify-safe-pmb';


function semiQry(s) { return qryStr((s.mimeType || s).replace(/;\s*/g, '&')); }


const mtFx = {

  static_ini(spec) {
    const specOpt = getOwn.bind(null, semiQry(spec));
    return {
      content: dictOfDictsToIniLines(spec.content, {
        eol: specOpt('eol', '\n'),
        translateValues: {
          'false': specOpt('false', 'no'),
          'true': specOpt('true', 'yes'),
        },
        pairSep: (specOpt('speq') ? ' = ' : specOpt('eq', '=')),
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
    pre = (pre ? pre + ' ' : '');
    if (tw === undefined) { tw = 2; }
    tw = ((+tw || 0) > 0 ? ', tab-width: ' + tw : '');
    const header = pre + '-*- coding: utf-8' + tw + ' -*-';
    return mtFx.lines({ content: [header].concat(spec.content) });
  },

  yaml(spec) {
    let data = yamlify(spec.content);
    if (!Array.isArray(data)) { data = String(data).trim().split(/\n/); }
    return mtFx.lines({ content: yamlify.wrapBody(data) });
  },

};




export default mtFx;
