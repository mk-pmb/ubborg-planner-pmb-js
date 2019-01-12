// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import nodeUtil from 'util';

import planResourceByTypeName from './resUtil/planResourceByTypeName';


async function ian(cliArgs) {
  const [topBundleFile] = cliArgs;
  const topCtx = {
    resourcesByTypeName: Object.create(null),
  };
  await planResourceByTypeName('bundle', topCtx, topBundleFile);
  console.log(nodeUtil.inspect(topCtx.resourcesByTypeName, {
    depth: null,
  }));
}


export default ian;
