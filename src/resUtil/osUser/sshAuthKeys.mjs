// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';
import pMap from 'p-map';
import rPad from 'lodash.padend';
import mapMerge from 'map-merge-defaults-pmb';

import vTry from 'vtry';
import slashableImport from '../../slashableImport.mjs';


function glueKeysDictEntry([k, v]) { return (k && v && `${v} ${k}`); }


const sak = {

  reformat(orig) {
    if (!orig) { return []; }
    const [typeName, , keyData, ...comment] = orig.split(/(\s+)/);
    return [...(rPad(typeName, 11) + ' ' + keyData).split(/([\S\s]{128})/),
      (comment.join('') + '\n')].filter(Boolean);
  },


  async mixin(res, opt) {
    const mustOpt = mustBe.prop(opt);
    const home = mustOpt('nonEmpty str', 'homeDirPath');
    // ^- We cannot use the ~/ autodetection because it would await the
    //    osUser plan and thus cause a loop of promises.
    const owner = mustOpt('nonEmpty str', 'ownerLoginName');
    const keys = await sak.combineKeySpecs(opt.sshAuthKeys);
    await (keys && mapMerge.pr({ owner, mimeType: 'dir' }, 'path', [
      home,
      home + '/.config',
      home + '/.config/ssh',
      { path: home + '/.ssh', mimeType: 'sym', content: '.config/ssh' },
      {
        path: home + '/.config/ssh/authorized_keys',
        mimeType: 'text/plain',
        enforcedModes: 'a=,u+r',
        content: keys,
      },
    ], res.needs.bind(res, 'userFile')));
  },


  async fromCjs(specs) {
    const dicts = await pMap([].concat(specs),
      spec => vTry.pr(slashableImport.fromBundleUrl,
        'Import sshAuthKeys from ' + spec)(spec));
    return Object.assign({}, ...dicts);
  },


  async combineKeySpecs(specs) {
    mustBe('undef | dictObj', specs);
    if (!specs) { return 0; }
    const popSpec = objPop(specs, { mustBe });
    const fromCjsRel = popSpec.mustBe('undef | nonEmpty str | ary', 'fromCjs');
    const fromCjsPr = (fromCjsRel && sak.fromCjs(fromCjsRel));
    popSpec.expectEmpty('Unsupported key source(s)');
    const keysDict = {
      ...(await fromCjsPr),
      ...popSpec.mustBe('undef | dictObj', 'verbatimDict'),
    };
    const keysList = [].concat(...Object.entries(keysDict,
    ).map(glueKeysDictEntry).map(sak.reformat));
    return (keysList.length && keysList);
  },


};

export default sak;
