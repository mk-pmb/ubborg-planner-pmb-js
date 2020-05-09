// -*- coding: utf-8, tab-width: 2 -*-

import univeil from 'univeil';

const { jsonify } = univeil;

function nameLine(color, cont, dest, ev) {
  const { indent } = ev.ctx;
  const clz = dest.colorize;
  dest.write(indent + clz(color) + '{'
    + clz('dimgrey') + ' "name": '
    + clz(color) + jsonify(ev.resName) + cont);
  dest.setPending(clz('dimgrey') + ',' + clz() + '\n');
}

const formatter = {

  walkOpts: {
    indentPrefix: '    ',
  },

  known: nameLine.bind(null,  'green',    ', "isRef": true }'),
  leaf: nameLine.bind(null,   'brviolet', ', "props": {} }'),

  async branch(dest, ev) {
    nameLine('yellow', '', dest, ev);
    const { indent } = ev.ctx;
    const clz = dest.colorize;
    let props = jsonify(ev.factsDict, null, 2);
    props = (ev.nFacts > 1
      ? props.replace(/\n/g, clz() + '\n  ' + indent + clz('teal'))
      : props.replace(/\n\s*/g, ' '));
    dest.write(indent + '  ' + clz('dimgrey') + '"props": '
      + clz('teal') + props + clz());
    if (ev.nVerbs) {
      dest.write(clz('dimgrey') + ',' + clz() + '\n' + indent + '  '
        + clz('dimgrey') + '"deps": [' + clz() + '\n');
      await ev.diveVerbsSeries();
      dest.setPending();
      dest.write('\n' + indent + '  ' + clz('dimgrey')
        + ']' + clz());
    }
    dest.write(' ' + clz('brown') + '}' + clz());
    dest.setPending(indent && ',\n');
  },

  footer(job) {
    const { state } = job;
    state.outputDest.write('\n');
  },
};

export default formatter;
