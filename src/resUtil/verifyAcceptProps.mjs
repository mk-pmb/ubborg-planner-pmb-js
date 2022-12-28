// -*- coding: utf-8, tab-width: 2 -*-

import aMap from 'map-assoc-core';
import is from 'typechecks-pmb';
import mustBe from 'typechecks-pmb/must-be';


function verifyAcceptProps(res, props) {
  const typeMeta = res.getTypeMeta();
  const { idProps, acceptProps, defaultProps } = typeMeta;
  if (acceptProps === true) { return; }
  const unsupp = [];
  // const inval = [];
  aMap(props, function checkProp(val, key) {
    if (val === undefined) { return; }
    if (idProps.includes(key)) { return; }
    const rule = acceptProps[key];
    if (rule === true) { return; }
    if (rule === undefined) {
      const dfVal = defaultProps[key];
      if (dfVal === null) { return; }
      const dfType = typeof dfVal;
      const valType = typeof val;
      if (valType === dfType) { return; }
    }
    if (is.str(rule) || is.ary(rule)) {
      mustBe(rule, `${String(res)} fact "${key}"`)(val);
      return;
    }
    unsupp.push(key);
  });
  if (unsupp.length) {
    const msg = ('Unsupported properties for type ' + typeMeta.name
      + ': ' + unsupp.join(', '));
    throw new Error(msg);
  }
}


export default verifyAcceptProps;
