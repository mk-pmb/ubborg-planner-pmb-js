// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';
import objPop from 'objpop';
import pMap from 'p-map';
import rPad from 'lodash.padend';

import vTry from 'vtry';
import slashableImport from '../../slashableImport';


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
    const homeDirPath = mustOpt('nonEmpty str', 'homeDirPath');
    const ownerName = mustOpt('nonEmpty str', 'ownerLoginName');
    const ownerGroup = (mustOpt('undef | nonEmpty str', 'ownerGroupName')
      || ownerName);
    const keys = await sak.combineKeySpecs(opt.sshAuthKeys);
    if (!keys) { return; }

    function homeSubDir(sub, props) {
      return res.needs('file', {
        path: homeDirPath + sub,
        mimeType: 'dir',
        enforcedOwner: ownerName,
        enforcedGroup: ownerGroup,
        enforcedModes: 'a=rx,ug+w',
        ...props,
      });
    };
    await homeSubDir('');
    await homeSubDir('/.config');
    await homeSubDir('/.config/ssh');
    await homeSubDir('/.ssh', { mimeType: 'sym', content: '.config/ssh' });
    await homeSubDir('/.config/ssh/authorized_keys', {
      mimeType: 'text/plain',
      enforcedModes: 'a=,u+rw',
      content: keys,
    });
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
    const keysList = [].concat(...Object.entries(keysDict
    ).map(glueKeysDictEntry).map(sak.reformat));
    return (keysList.length && keysList);
  },


};

export default sak;
