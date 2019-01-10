// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';

import resourceProviders from './resProv/resourceProviders';


async function ian(cliArgs) {
  const [topBundleFile] = cliArgs;
  const bun = await resourceProviders.planByTypeName('bundle', null,
    topBundleFile);
  console.dir(bun.context);
}


export default ian;
