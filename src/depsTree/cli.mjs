// -*- coding: utf-8, tab-width: 2 -*-

import 'usnam-pmb';
import minimist from 'minimist';
import pMap from 'p-map';
import makeFirstAvailModLoader from 'load-first-avail-module';

import walkDepsTree from './walk';
import makeToplevelContext from '../resUtil/makeToplevelContext';
import planResourceByTypeName from '../resUtil/planResourceByTypeName';
import makeColorfulLogDest from '../makeColorfulLogDest';

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
  const { outputDest, formatter: fmt } = ev.ctx.state;
  if (ev.nPrevEncounters && fmt.known) { return fmt.known(outputDest, ev); }

  const { resPlan, subRelVerbPrs } = ev;
  delete subRelVerbPrs.spawns;

  const factsDict = await resPlan.toFactsDict();
  const tn = resPlan.typeName;
  if (tn === 'stage') { delete factsDict.basedir; }

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


function checkCyclicDeps(job, formatter) {
  const optName = 'allowCyclicDeps';
  const optVal = job[optName];
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
  const job = minimist(cliArgsOrig);
  const [topBundleFile] = job._;
  const topCtx = makeToplevelContext();
  const topRes = await planResourceByTypeName('stage', topCtx, topBundleFile);

  const fmtName = (job.format || 'plusText');
  const mkFmt = (await importFirstAvailableModule([
    `../depsTree/dumpFmt/${fmtName}`,
    fmtName,
  ])).default;
  if (!mkFmt) { throw new Error('Unsupported output format'); }
  const formatter = await (mkFmt.call ? mkFmt(job) : mkFmt);
  const outputDest = makeColorfulLogDest(job);

  const wdtJob = {
    ...formatter.walkOpts,
    ...checkCyclicDeps(job, formatter),
    root: topRes,
    foundRes,
    state: {
      outputDest,
      formatter,
    },
  };

  await callIf(formatter.header, wdtJob);
  await walkDepsTree(wdtJob);
  await callIf(formatter.footer, wdtJob);
}


export default { runFromCli };
