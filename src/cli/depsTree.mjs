// -*- coding: utf-8, tab-width: 2 -*-

import 'usnam-pmb';
import pEachSeries from 'p-each-series';
import univeil from 'univeil';

import makeToplevelContext from '../resUtil/makeToplevelContext';
import planResourceByTypeName from '../resUtil/planResourceByTypeName';


const { jsonify } = univeil;


function printDepsTree(resPr) {
  const ctx = { hadRes: new Set() };
  return printDepsTree.core(ctx, '', resPr);
}

printDepsTree.core = async function printDepsTreeCore(ctx, indent, resPr) {
  const res = await resPr;
  const resName = String(res);
  await res.hatchedPr;

  const { hadRes } = ctx;
  if (hadRes.has(resName)) {
    console.log((indent + '^'), resName);
    return;
  }
  hadRes.add(resName);

  const factsDict = await res.toFactsDict();
  const factNames = Object.keys(factsDict).sort();

  const verbsDict = { ...(await res.relations.getRelatedPlanPromises()) };
  delete verbsDict.spawns;
  const relaVerbs = Object.keys(verbsDict).sort();

  if (relaVerbs.length || factNames.length) {
    console.log((indent + '+'), resName);
  } else {
    console.log((indent + '*'), resName);
    return;
  }

  const verbInd = indent + '  ';
  const subInd = verbInd + '  ';

  factNames.forEach(function printOneFact(key) {
    const val = factsDict[key];
    console.log(verbInd + '=', jsonify(key) + ':', jsonify(val));
  });

  function printSubDep(subPr) {
    return printDepsTree.core(ctx, subInd, subPr);
  }
  async function collectOneVerb(verb) {
    const plans = await Promise.all(verbsDict[verb]);
    console.log((verbInd + '~'), verb);
    await pEachSeries(plans, printSubDep);
  }
  await pEachSeries(relaVerbs, collectOneVerb);
  console.log((verbInd + '-'), resName);
};


async function runFromCli(topBundleFile) {
  const topCtx = makeToplevelContext();
  const topRes = await planResourceByTypeName('stage', topCtx, topBundleFile);
  await printDepsTree(topRes);
}


export default { runFromCli };
