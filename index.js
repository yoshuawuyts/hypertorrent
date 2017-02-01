var memoryStore = require('memory-chunk-store')
var WebTorrent = require('webtorrent')
var hyperdrive = require('hyperdrive')
var mapLimit = require('map-limit')
var assert = require('assert')
var pump = require('pump')

module.exports = hypertorrent

function hypertorrent (torrentFile, db, opts, cb) {
  if (!cb) {
    cb = opts
    opts = {}
  }

  assert.ok(typeof torrentFile === 'string' || Buffer.isBuffer(torrentFile), 'hypertorrent: torrent should be a string or a buffer')
  assert.equal(typeof db, 'object', 'hypertorrent: db should be an object')
  assert.equal(typeof cb, 'function', 'hypertorrent: cb should be an function')
  assert.equal(typeof opts, 'object', 'hypertorrent: opts should be an object')

  var drive = hyperdrive(db)
  var archive = (opts.key)
    ? drive.createArchive(opts.key, opts)
    : drive.createArchive(opts)

  var webTorrent = new WebTorrent()
  // try catch because webtorrent.add doesnt have an errback???
  try {
    webTorrent.add(torrentFile, {store: memoryStore}, onAdd)
  } catch (e) {
    cb(e)
  }

  function onAdd (torrent) {
    // Hack, don't download everything right away https://github.com/feross/webtorrent/issues/164#issuecomment-248395202
    torrent.deselect(0, torrent.pieces.length - 1, false)

    mapLimit(torrent.files, 1, iterator, cb)

    function iterator (file, done) {
      var rs = file.createReadStream()
      var ws = archive.createFileWriteStream(file.name)
      pump(rs, ws, done)
    }
  }

  return {
    archive: archive,
    torrent: webTorrent
  }
}
