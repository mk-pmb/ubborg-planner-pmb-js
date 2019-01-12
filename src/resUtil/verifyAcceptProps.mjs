// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';


function verifyAcceptProps(rules, props) {
  if (rules === true) { return true; }
  const unsupp = [];
  // const inval = [];
  aMap(props, function checkProp(val, key) {
    if (val === undefined) { return; }
    const rule = props[key];
    if (rule === true) { return; }
    unsupp.push(key);
  });
  if (unsupp.length) {
    throw new Error('Unsupported properties: ' + unsupp.join(', '));
  }
}


export default verifyAcceptProps;
