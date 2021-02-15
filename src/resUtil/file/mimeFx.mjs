// -*- coding: utf-8, tab-width: 2 -*-

import dictOfDictsToIniLines from 'dict-of-dicts-to-ini-lines-pmb';
import qryStr from 'qrystr';
import getOwn from 'getown';
import yamlify from 'yamlify-safe-pmb';
import jsonify from 'safe-sortedjson';


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
    let tx = spec.content;
    if (!Array.isArray(tx)) {
      tx = String(tx).trim().split(/\n/);
      // Would be nice to have non-consuming look-behind, so we could
      // split immediately after /\n/, rather than re-appending it.
    }
    tx = tx.map(ln => ln + '\n');
    return { mimeType: 'text/plain; charset=UTF-8', content: tx };
  },

  utf8_tw(spec) {
    let [, tw, pre] = spec.mimeType.split(/; */);
    pre = (pre ? decodeURIComponent(pre) + ' ' : '');
    if (tw === undefined) { tw = 2; }
    tw = ((+tw || 0) > 0 ? ', tab-width: ' + tw : '');
    const header = pre + '-*- coding: utf-8' + tw + ' -*-';
    return mtFx.lines({ content: [header].concat(spec.content) });
  },

  yaml(spec) {
    return mtFx.lines({ content: yamlify.wrapBody(yamlify(spec.content)) });
  },

  json(spec) { return mtFx.lines({ content: jsonify(spec.content) }); },

};




export default mtFx;
