// -*- coding: utf-8, tab-width: 2 -*-
// Simple non-magic props = props that don't change hatching significantly.

import aMap from 'map-assoc-core';
import objMapMerge from 'obj-map-merge';


const osAccessProps = {
  ownership: {
    Owner: 'pos num | nonEmpty str',
    Group: 'pos num | nonEmpty str',
  },
  permissions: {
    Modes: 'nonEmpty str',
  },
};
osAccessProps.all = Object.assign({}, ...Object.values(osAccessProps));

const EX = {
  ...aMap(osAccessProps, function renderOneCategory(categ) {
    return objMapMerge(function addPropNamePrefixes(k, v) {
      return {
        ['created' + k]: v,     // if the file is to be created
        ['enforced' + k]: v,    // in case the file existed already
      };
    })(categ);
  }),
  annotations: {
    debugHints: 'dictObj',
  },
};

EX.uselessOnAbsentFiles = {
  ...EX.ownership,
  ...EX.permissions,
};
EX.allResProps = {
  ...EX.uselessOnAbsentFiles,
  ...EX.annotations,
};

Object.assign(EX, {
  osAccessProps,
});

export default EX;
