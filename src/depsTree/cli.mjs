// -*- coding: utf-8, tab-width: 2 -*-

import 'usnam-pmb';
import minimist from 'minimist';
import pMap from 'p-map';
import makeFirstAvailModLoader from 'load-first-avail-module';
import objPop from 'objpop';

import walkDepsTree from './walk.mjs';
import resHook from './resHook/__main__.mjs';
import makeToplevelContext from '../resUtil/makeToplevelContext.mjs';
import planResourceByTypeName from '../resUtil/planResourceByTypeName.mjs';
import makeColorfulLogDest from '../makeColorfulLogDest.mjs';
import makeAptPkgNamesChecker from './makeAptPkgNamesChecker.mjs';

const importFirstAvailableModule = makeFirstAvailModLoader(id => import(id));

function keyCnt(x) { return Object.keys(x).length; }

async function mapFactsDict(opt, iter) {
  const ev = this;
  if ((!iter) && opt.apply) { return mapFactsDict.call(ev, false, opt); }
  const { factsDict } = ev;
  let keys = Object.keys(factsDict);
  if (opt.sort !== false) { keys = keys.sort(); }
  const { conc } = opt;
  const ppOpt = {};
  if (conc !== true) { ppOpt.concurrency = (+conc || 1); }
  function wrap(key) { return iter(factsDict[key], key, factsDict); }
  return pMap(keys, wrap, ppOpt);
}


async function foundRes(ev) {
  const { outputDest, formatter: fmt } = ev.ourCtx.config;
  if (ev.nPrevEncounters && fmt.known) { return fmt.known(outputDest, ev); }

  const { resPlan, subRelVerbPrs } = ev;
  delete subRelVerbPrs.spawns;

  const factsDict = await resPlan.toFactsDict();
  Object.assign(factsDict, await resHook(resPlan.typeName,
    'foundResCheckFacts', { ...ev, factsDict }));

  const nFacts = keyCnt(factsDict);
  const nVerbs = keyCnt(subRelVerbPrs);
  const hasDetails = Boolean(nFacts || nVerbs);
  Object.assign(ev, {
    factsDict,
    mapFactsDict,
    nFacts,
    nVerbs,
    hasDetails,
  });
  const hnd = ((hasDetails ? fmt.branch : fmt.leaf) || fmt.res);
  return hnd.call(fmt, outputDest, ev);
}


function checkCyclicDeps(popCliArg, formatter) {
  const optName = 'allowCyclicDeps';
  const optVal = popCliArg(optName);
  if (!optVal) { return; }
  if (optVal !== true) {
    throw new Error('Unsupported value for option ' + optName);
  }
  if (!formatter.supportsCyclicDive) {
    throw new Error('Option ' + optName
      + ' is not supported for the selected output format');
  }
  return { forbidCyclicDive: false };
}


function callIf(func, ...args) { return (func && func(...args)); }


async function runFromCli(...cliArgsOrig) {
  const popCliArg = objPop(minimist(cliArgsOrig));
  const [topBundleFile] = popCliArg('_');
  const topCtx = makeToplevelContext();
  const topRes = await planResourceByTypeName('stage', topCtx, topBundleFile);

  const fmtName = (popCliArg('format') || 'plusText');
  const mkFmt = (await importFirstAvailableModule([
    `../depsTree/dumpFmt/${fmtName}`,
    fmtName,
  ])).default;
  if (!mkFmt) { throw new Error('Unsupported output format'); }
  const formatter = await (mkFmt.call ? mkFmt(popCliArg) : mkFmt);
  const outputDest = makeColorfulLogDest(popCliArg);

  const aptPkgNamesChecker = await makeAptPkgNamesChecker(popCliArg);

  popCliArg.expectEmpty('Unsupported CLI option(s)');

  const wdtJob = {
    ...formatter.walkOpts,
    ...checkCyclicDeps(popCliArg, formatter),
    root: topRes,
    foundRes,
    config: {
      outputDest,
      formatter,
      getTopCtx() { return topCtx; },
      aptPkgNamesChecker,
    },
  };

  await callIf(formatter.header, wdtJob);
  await walkDepsTree(wdtJob);
  await callIf(formatter.footer, wdtJob);
}


export default { runFromCli };
