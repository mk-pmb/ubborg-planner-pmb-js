#!/usr/bin/env nodemjs
// -*- coding: utf-8, tab-width: 2 -*-


function describeType(x) {
  if (x === '') { return 'empty string'; }
  if (x === null) { return 'null'; }
  return typeof x;
};


export default describeType;
