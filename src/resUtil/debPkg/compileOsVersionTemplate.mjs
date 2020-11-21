// -*- coding: utf-8, tab-width: 2 -*-

import sysFactsHelper from 'ubborg-sysfacts-helper-pmb';
import ubuntuVersions from 'ubuntu-versions-table-pmb';
import mustBe from 'typechecks-pmb/must-be';
import getOwn from 'getown';

async function compileOsVersionTemplate(res) {
  const t = 'osVersion';
  const d = await sysFactsHelper.mtd(res, t)();
  if (d.distro === 'ubuntu') {
    if (!d.release) {
      d.release = (ubuntuVersions.apt2rls(d.codename) || '00.00');
    }
  }
  const r = /%\{([\w\-]+)\}/g;
  function w(m, k) { return m && mustBe.nest(`${t}.${k}`, getOwn(d, k)); }
  return function renderOsVersionTemplate(s) { return s.replace(r, w); };
}

export default compileOsVersionTemplate;
