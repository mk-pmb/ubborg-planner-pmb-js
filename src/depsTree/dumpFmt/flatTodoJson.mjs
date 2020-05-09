// -*- coding: utf-8, tab-width: 2 -*-

import univeil from 'univeil';

const { jsonify } = univeil;

function mergeLines(s) { return s.replace(/\n\s*/g, ' '); }

function renderProps(ev, clz) {
  const { nFacts } = ev;
  if (nFacts < 1) { return '{}'; }
  const props = clz('teal') + jsonify(ev.factsDict, null, 2);
  if (nFacts < 2) { return mergeLines(props); }
  return props.replace(/\n/g, clz() + '\n  ' + clz('teal'));
}

function nameLine(color, cont, dest, ev) {
  dest.clog('dimgrey', '',
    ', { "name": ' + dest.colorize(color) + jsonify(ev.resName) + cont);
}

const formatter = {
  fmtMeta: {
    name: 'flatTodoJson',
    version: '200509-0700',
  },

  header(job) {
    const meta = { format: formatter.fmtMeta };
    job.state.outputDest.log('[ ' + mergeLines(jsonify(meta, null, 2)));
  },

  known: nameLine.bind(null,  'green',    ', "isRef": true }'),
  leaf: nameLine.bind(null,   'brviolet', ', "props": {} }'),

  async branch(dest, ev) {
    await ev.diveVerbsSeries();
    let color = 'yellow';
    if (ev.nFacts < 1) { color = 'brown'; }
    const clz = dest.colorize;
    const props = (clz('dimgrey') + ', "props": '
      + renderProps(ev, clz) + clz('dimgrey') + ' }');
    nameLine(color, props, dest, ev);
  },

  footer(job) { job.state.outputDest.log(']'); },
};

export default formatter;
