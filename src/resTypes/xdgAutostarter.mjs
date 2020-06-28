// -*- coding: utf-8, tab-width: 2 -*-

import deFile from './xdgDesktopEntryFile';

function plan(spec) {
  const baseDir = (spec.owner ? '~/.config' : '/etc/xdg') + '/autostart';
  return deFile.inDir(baseDir).call(this, spec);
}

export default { plan };
