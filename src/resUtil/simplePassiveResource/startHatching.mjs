// -*- coding: utf-8, tab-width: 2 -*-

import pImmediate from 'p-immediate';

function startHatching(res, ...hatchArgs) {
  async function waitUntilHatched() {
    await pImmediate();
    if (!res.hatchedPr) { throw new Error('Still no .hatchedPr?!'); }
    await res.hatch(...hatchArgs);
    return Object.assign(res, { hatching: false });
  }
  return Object.assign(res, {
    hatching: true,  // see also: .hasHatched() in API
    hatchedPr: waitUntilHatched(),
  });
}

export default startHatching;
