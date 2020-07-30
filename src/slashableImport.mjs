// -*- coding: utf-8, tab-width: 2 -*-

import makeSlim from 'slashable-import-pmb';
import bunUrls from 'ubborg-bundleurl-util-pmb';

const slim = makeSlim();

Object.assign(slim, {

  fromBundleUrl(url) { return slim(bunUrls.toModuleId(bunUrls.href(url))); },

});

export default slim;
