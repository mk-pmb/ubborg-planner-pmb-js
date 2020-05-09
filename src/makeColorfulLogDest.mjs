// -*- coding: utf-8, tab-width: 2 -*-

import termColorNums from 'terminal-color-numbers-pmb';

function emptyStrFunc() { return ''; }
function colorizeOrReset(c) { return termColorNums.esc(c || 'reset'); }

function makeColorfulLogDest(opt, ovr) {
  if (!opt) { return makeColorfulLogDest(true, ovr); }
  const cl = {
    stream: process.stdout,

    pending: '',
    setPending(x) { cl.pending = (x || ''); },
    addPending(x) { cl.pending += x; },

    write(...args) {
      if (cl.pending) { cl.stream.write(cl.pending); }
      cl.pending = '';
      return cl.stream.write(...args);
    },
    log(...parts) { return cl.write(parts.join(' ') + '\n'); },

    colorize: (opt.color ? colorizeOrReset : emptyStrFunc),
    clog(color, indent, ...parts) {
      return cl.write(indent + cl.colorize(color)
        + parts.join(' ') + cl.colorize() + '\n');
    },

    ...ovr,
  };
  return cl;
}


export default makeColorfulLogDest;
