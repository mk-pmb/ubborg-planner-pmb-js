// -*- coding: utf-8, tab-width: 2 -*-
// Simple non-magic props = props that don't change hatching significantly.

const EX = {
  accessProps: {
    // If the file is to be created:
    createdOwner: 'pos num | nonEmpty str',
    createdGroup: 'pos num | nonEmpty str',
    createdModes: 'nonEmpty str',

    // In case the file existed already:
    enforcedOwner: 'pos num | nonEmpty str',
    enforcedGroup: 'pos num | nonEmpty str',
    enforcedModes: 'nonEmpty str',
  },
  annotations: {
    debugHints: 'dictObj',
  },
};

EX.all = Object.assign({}, ...Object.values(EX));

export default EX;
