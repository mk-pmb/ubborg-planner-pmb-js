// -*- coding: utf-8, tab-width: 2 -*-

import univeil from 'univeil';

const { jsonify } = univeil;
const dimColor = 'dimgrey';

function jsonify2(x) { return jsonify(x, null, 2); }
function mergeLines(s) { return s.replace(/\n\s*/g, ' '); }

function renderProps(ev, clz) {
  const { nFacts } = ev;
  if (nFacts < 1) { return '{}'; }
  const props = clz('teal') + jsonify2(ev.factsDict);
  if (nFacts < 2) { return mergeLines(props); }
  return props.replace(/\n/g, clz() + '\n  ' + ev.ctx.indent + clz('teal'));
}

function nameLine(nameColor, cont, dest, ev) {
  const clz = dest.colorize;
  const res = ev.resPlan;
  dest.clog(dimColor, ev.ctx.indent + ', ', clz(nameColor) + '{'
    + clz(dimColor) + ' "type": ' + clz(nameColor) + jsonify(res.typeName)
    + clz(dimColor) + ', "id": ' + clz(nameColor) + jsonify(res.id)
    + cont);
}


async function describeRes(dest, ev) {
  const { notes } = ev;
  if (notes.wasExplained) {
    // nameLine('green', ', "isRef": true }', dest, ev);
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
  const props = (clz(dimColor) + ', "props": '
    + renderProps(ev, clz) + clz(dimColor) + ' }');
  nameLine(color, props, dest, ev);
  notes.wasExplained = true;
}


const formatter = {
  fmtMeta: {
    name: 'flatTodoJson',
    version: '200509-0700',
  },

  supportsCyclicDive: true,

  walkOpts: {
    indentPrefix: '',
  },

  header(job) {
    const { outputDest: { log: say }, getTopCtx } = job.config;
    say('[ { "format":', mergeLines(jsonify2(formatter.fmtMeta)));
    say('  , "uniqueIndexProps":',
      jsonify2(getTopCtx().resByUniqueIndexProp.toJsonablePojo()
      ).replace(/\n/g, '\n    '));
    say('  }');
  },
  res: describeRes,

  footer(job) { job.config.outputDest.log(']'); },
};

export default formatter;
