// -*- coding: utf-8, tab-width: 2 -*-

import univeil from 'univeil';

const { jsonify } = univeil;

function nameLine(cont, dest, ev) {
  dest.log(ev.ctx.indent + '{ "name": ' + jsonify(ev.resName) + cont);
}

const formatter = {

  walkOpts: {
    indentPrefix: '    ',
  },

  known: nameLine.bind(null,  ' },'),
  leaf: nameLine.bind(null,   ' },'),

  async branch(dest, ev) {
    nameLine(',', dest, ev);
    const { indent } = ev.ctx;
    let props = jsonify(ev.factsDict, null, 2);
    props = (ev.nFacts > 1
      ? props.replace(/\n/g, '\n  ' + indent)
      : props.replace(/\n\s*/g, ' ')
    );
    dest.log(indent + '  "props": ' + props + ',');
    dest.log(indent + '  "deps": [');
    await ev.diveVerbsSeries();
    dest.log(indent + '  ] }' + (indent && ','));
  },

};

export default formatter;
