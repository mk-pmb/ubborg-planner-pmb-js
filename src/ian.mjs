// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';

import resourceProviders from './resProv/resourceProviders';


async function ian(cliArgs) {
  const [topBundleFile] = cliArgs;
  const topCtx = {
    resourcesByTypeName: Object.create(null),
  };
  await resourceProviders.planByTypeName('bundle', topCtx, topBundleFile);
  console.dir(topCtx.resourcesByTypeName);
}


export default ian;
