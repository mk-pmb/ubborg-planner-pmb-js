// -*- coding: utf-8, tab-width: 2 -*-

import univeil from 'univeil';

const { jsonify } = univeil;

function nameLine(symb, dest, ev) {
  dest.log(ev.ctx.indent + symb + ' ' + ev.resName);
}

const formatter = {

  walkOpts: {
    indentPrefix: '  ',
  },

  known: nameLine.bind(null, '^'),
  leaf: nameLine.bind(null, '*'),

  async branch(dest, ev) {
    nameLine('+', dest, ev);
    const { subInd } = ev.ctx;
    await ev.mapFactsDict(function printFact(val, key) {
      dest.log(subInd + '= ' + jsonify(key) + ': ' + jsonify(val));
    });
    await ev.diveVerbsSeries();
    dest.log(subInd + '- ' + ev.resName);
  },

};

export default formatter;
