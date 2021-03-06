// -*- coding: utf-8, tab-width: 2 -*-

const mta = {
  blk:  'inode/blockdevice',
  char: 'inode/chardevice',
  dir:  'inode/directory',
  dirOrMounted: 'inode/directory; or-active-mountpoint',
  fifo: 'inode/fifo',
  sock: 'inode/socket',
  sym:  'inode/symlink',  // only for broken ones. see the "symlink" resType.
  blob: 'application/octet-stream',
  b64:  'application/octet-stream;base64',
};

export default mta;
