// -*- coding: utf-8, tab-width: 2 -*-

import univeil from 'univeil';

const { jsonify } = univeil;

function nameLine(color, symb, dest, ev) {
  dest.clog(color, ev.ctx.indent, symb + ' ' + ev.resName);
}

const formatter = {

  walkOpts: {
    indentPrefix: '  ',
  },

  known: nameLine.bind(null, 'green', '^'),
  leaf: nameLine.bind(null, 'brgreen', '*'),

  async branch(dest, ev) {
    nameLine('yellow', '+', dest, ev);
    const { subInd } = ev.ctx;
    await ev.mapFactsDict(function printFact(val, key) {
      dest.clog('teal', subInd, '= ' + jsonify(key) + ': ' + jsonify(val));
    });
    await ev.diveVerbsSeries();
    dest.clog('brown', subInd, '-', ev.resName);
  },

};

export default formatter;
