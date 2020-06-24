// -*- coding: utf-8, tab-width: 2 -*-

import is from 'typechecks-pmb';
import univeil from 'univeil';

const { jsonify } = univeil;

function nameLine(color, symb, dest, ev) {
  dest.clog(color, ev.ctx.indent, symb + ' ' + ev.resName);
}

const rxSimpleId = /^[\w\-]+$/s;

function jsonifyUnlessSimpleId(x) {
  if (is.str(x) && rxSimpleId.test(x)) { return x; }
  return jsonify(x);
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
      dest.clog('teal', subInd, '= ' + jsonifyUnlessSimpleId(key)
        + ': ' + jsonify(val, -1));
    });
    await ev.diveVerbsSeries();
    dest.clog('brown', subInd, '-', ev.resName);
  },

};

export default formatter;
