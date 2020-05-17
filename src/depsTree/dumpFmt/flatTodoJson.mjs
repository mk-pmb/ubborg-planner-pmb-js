// -*- coding: utf-8, tab-width: 2 -*-

import univeil from 'univeil';

const { jsonify } = univeil;

function mergeLines(s) { return s.replace(/\n\s*/g, ' '); }

function renderProps(ev, clz) {
  const { nFacts } = ev;
  if (nFacts < 1) { return '{}'; }
  const props = clz('teal') + jsonify(ev.factsDict, null, 2);
  if (nFacts < 2) { return mergeLines(props); }
  return props.replace(/\n/g, clz() + '\n  ' + ev.ctx.indent + clz('teal'));
}

function nameLine(color, cont, dest, ev) {
  dest.clog('dimgrey', ev.ctx.indent,
    ', { "name": ' + dest.colorize(color) + jsonify(ev.resName) + cont);
}


async function describeRes(dest, ev) {
  const { notes } = ev;
  if (notes.wasExplained) {
    nameLine('green', ', "isRef": true }', dest, ev);
    return;
  }
  const { cycleSteps } = ev.ctx;
  if (cycleSteps) {
    nameLine('brred', ', "cyclic": ' + cycleSteps + ' }', dest, ev);
    return;
  }
  await ev.diveVerbsSeries();
  let color = 'yellow';
  if (ev.nFacts < 1) { color = 'brown'; }
  const clz = dest.colorize;
  const props = (clz('dimgrey') + ', "props": '
    + renderProps(ev, clz) + clz('dimgrey') + ' }');
  nameLine(color, props, dest, ev);
  notes.wasExplained = true;
}


const formatter = {
  fmtMeta: {
    name: 'flatTodoJson',
    version: '200509-0700',
  },

  walkOpts: {
    indentPrefix: '',
    forbidCyclicDive: false,
  },

  header(job) {
    const meta = { format: formatter.fmtMeta };
    const { state } = job;
    state.outputDest.log('[ ' + mergeLines(jsonify(meta, null, 2)));
  },
  res: describeRes,

  footer(job) { job.state.outputDest.log(']'); },
};

export default formatter;
