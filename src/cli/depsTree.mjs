// -*- coding: utf-8, tab-width: 2 -*-

import 'usnam-pmb';
import minimist from 'minimist';
import pMap from 'p-map';
import makeFirstAvailModLoader from 'load-first-avail-module';

import makeToplevelContext from '../resUtil/makeToplevelContext';
import planResourceByTypeName from '../resUtil/planResourceByTypeName';
import walkDepsTree from '../depsTree/walk';

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
  const { logDest, formatter: fmt } = ev.ctx.state;
  if (ev.prevEncounters && fmt.known) { return fmt.known(logDest, ev); }

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
  return hnd.call(fmt, logDest, ev);
}


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

  await walkDepsTree({
    ...formatter.walkOpts,
    root: topRes,
    foundRes,
    state: {
      logDest: console,
      formatter,
    },
  });
}


export default { runFromCli };
