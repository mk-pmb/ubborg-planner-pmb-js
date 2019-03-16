// -*- coding: utf-8, tab-width: 2 -*-

import 'usnam-pmb';
import univeil from 'univeil';

import makeToplevelContext from '../resUtil/makeToplevelContext';
import planResourceByTypeName from '../resUtil/planResourceByTypeName';
import walkDepsTree from '../walkDepsTree';


const { jsonify } = univeil;
const indentPrefix = '  ';

function keyCnt(x) { return Object.keys(x).length; }


async function foundRes(ev) {
  const { indent, subInd } = ev.ctx;
  if (ev.prevEncounters) {
    console.log(indent + '^', ev.resName);
    return;
  }

  // const state = ev.forkState();

  const { resPlan, resName, subRelVerbPrs } = ev;
  delete subRelVerbPrs.spawns;
  const factsDict = await resPlan.toFactsDict();
  const factNames = Object.keys(factsDict);

  const showDetails = (factNames.length || keyCnt(subRelVerbPrs));
  console.log(indent + (showDetails ? '+' : '*'), resName);
  if (!showDetails) { return; }

  factNames.sort().forEach(function printOneFact(key) {
    console.log(subInd + '=', jsonify(key) + ':', jsonify(factsDict[key]));
  });

  await ev.diveVerbsSeries();
  console.log(subInd + '-', resName);
}


async function runFromCli(topBundleFile) {
  const topCtx = makeToplevelContext();
  const topRes = await planResourceByTypeName('stage', topCtx, topBundleFile);

  await walkDepsTree({
    root: topRes,
    indentPrefix,
    foundRes,
  });
}


export default { runFromCli };
