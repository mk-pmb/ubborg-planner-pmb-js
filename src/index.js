// -*- coding: utf-8, tab-width: 2 -*-
'use strict';

const pkgName = require('../package.json').name;

throw new Error(pkgName + ' is meant to be run via its CLI command.');
