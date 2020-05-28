// -*- coding: utf-8, tab-width: 2 -*-

import univeil from 'univeil';

const { jsonify } = univeil;
const dimColor = 'dimgrey';

function nameLine(nameColor, cont, dest, ev) {
  const { indent } = ev.ctx;
  const clz = dest.colorize;
  const res = ev.resPlan;
  dest.write(indent + clz(nameColor) + '{'
    + clz(dimColor) + ' "type": ' + clz(nameColor) + jsonify(res.typeName)
    + clz(dimColor) + ', "id": ' + clz(nameColor) + jsonify(res.id)
    + cont);
  dest.setPending(clz(dimColor) + ',' + clz() + '\n');
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
    dest.write(indent + '  ' + clz(dimColor) + '"props": '
      + clz('teal') + props + clz());
    if (ev.nVerbs) {
      dest.write(clz(dimColor) + ',' + clz() + '\n' + indent + '  '
        + clz(dimColor) + '"deps": [' + clz() + '\n');
      await ev.diveVerbsSeries();
      dest.setPending();
      dest.write('\n' + indent + '  ' + clz(dimColor)
        + ']' + clz());
    }
    dest.write(' ' + clz('brown') + '}' + clz());
    dest.setPending(indent && ',\n');
  },

  footer(job) {
    job.config.outputDest.write('\n');
  },
};

export default formatter;
