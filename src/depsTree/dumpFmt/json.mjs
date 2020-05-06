// -*- coding: utf-8, tab-width: 2 -*-

import univeil from 'univeil';

const { jsonify } = univeil;

function nameLine(cont, dest, ev) {
  const { indent } = ev.ctx;
  dest.write(indent + '{ "name": ' + jsonify(ev.resName) + cont);
  dest.setPending(',\n');
}

const formatter = {

  walkOpts: {
    indentPrefix: '    ',
  },

  known: nameLine.bind(null,  ', "had": true }'),
  leaf: nameLine.bind(null,   ' }'),

  async branch(dest, ev) {
    nameLine('', dest, ev);
    const { indent } = ev.ctx;
    let props = jsonify(ev.factsDict, null, 2);
    props = (ev.nFacts > 1
      ? props.replace(/\n/g, '\n  ' + indent)
      : props.replace(/\n\s*/g, ' ')
    );
    dest.write(indent + '  "props": ' + props);
    if (ev.nVerbs) {
      dest.write(',\n' + indent + '  "deps": [\n');
      await ev.diveVerbsSeries();
      dest.setPending();
      dest.write('\n' + indent + '  ]');
    }
    dest.write(' }');
    dest.setPending(indent && ',\n');
  },

  footer(job) {
    const { state } = job;
    state.outputDest.write('\n');
  },
};

export default formatter;
