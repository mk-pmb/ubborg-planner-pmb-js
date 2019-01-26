// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';


function verifyAcceptProps(typeMeta, props) {
  const { acceptProps, defaultProps } = typeMeta;
  if (acceptProps === true) { return true; }
  const unsupp = [];
  // const inval = [];
  aMap(props, function checkProp(val, key) {
    if (val === undefined) { return; }
    const rule = acceptProps[key];
    if (rule === true) { return; }
    if (rule === undefined) {
      const dfVal = defaultProps[key];
      if (dfVal === null) { return; }
      const dfType = typeof dfVal;
      const valType = typeof val;
      if (valType === dfType) { return; }
    }
    unsupp.push(key);
  });
  if (unsupp.length) {
    throw new Error('Unsupported properties: ' + unsupp.join(', '));
  }
}


export default verifyAcceptProps;