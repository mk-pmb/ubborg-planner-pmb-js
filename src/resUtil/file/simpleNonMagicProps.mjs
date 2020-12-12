// -*- coding: utf-8, tab-width: 2 -*-
// Simple non-magic props = props that don't change hatching significantly.

import objMapMerge from 'obj-map-merge';


const osAccessProps = {
  Owner: 'pos num | nonEmpty str',
  Group: 'pos num | nonEmpty str',
  Modes: 'nonEmpty str',
};

const EX = {
  accessProps: objMapMerge(function map(k, v) {
    return {
      ['created' + k]: v,     // if the file is to be created
      ['enforced' + k]: v,    // in case the file existed already
    };
  })(osAccessProps),
  annotations: {
    debugHints: 'dictObj',
  },
};

EX.all = Object.assign({}, ...Object.values(EX));

Object.assign(EX, {
  osAccessProps,
});

export default EX;
