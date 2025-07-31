// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';


function rewriteUrlProtos(origUrl) {
  let u = mustBe.nest('URL', origUrl);

  u = u.replace(/^ppa:(\S+)/, 'http://ppa.launchpad.net/$1/%{distro}');
  // Why no SSL? -> https://bugs.launchpad.net/launchpad/+bug/1473091
  // Discussion of possible attack vectors against unencrypted
  // downloading of signed packages:
  // https://github.com/nodesource/distributions/issues/71
  // (2020-07-05: Mostly, hiding new updates for as long as the
  // old signature is still valid.)

  return u;
}


export default rewriteUrlProtos;
