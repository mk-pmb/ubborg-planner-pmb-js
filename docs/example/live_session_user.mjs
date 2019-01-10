// -*- coding: utf-8, tab-width: 2 -*-

export default async function bundle() {
  this.needs('osUser', {
    '': 'live',
    passwordHash: '$6$bogusbogus$bogusbogusbogus',
  });
};
