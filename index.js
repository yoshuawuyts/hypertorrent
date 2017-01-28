var torrentStream = require('torrent-stream')
var hyperdrive = require('hyperdrive')
var mapLimit = require('map-limit')
var assert = require('assert')
var pump = require('pump')

module.exports = hypertorrent

function hypertorrent (torrent, db, opts, cb) {
  if (!cb) {
    cb = opts
    opts = {}
  }

  assert.ok(typeof torrent === 'string' || Buffer.isBuffer(torrent), 'hypertorrent: torrent should be a string or a buffer')
  assert.equal(typeof db, 'object', 'hypertorrent: db should be an object')
  assert.equal(typeof cb, 'function', 'hypertorrent: cb should be an function')
  assert.equal(typeof opts, 'object', 'hypertorrent: opts should be an object')

  var drive = hyperdrive(db)
  var archive = (opts.key)
    ? drive.createArchive(opts.key, opts)
    : drive.createArchive(opts)

  var engine = torrentStream(torrent)
  engine.on('ready', function () {
    mapLimit(engine.files, 1, iterator, cb)

    function iterator (file, done) {
      var rs = file.createReadStream()
      var ws = archive.createFileWriteStream(file.name)
      pump(rs, ws, done)
    }
  })

  return {
    archive: archive,
    torrent: engine
  }
}
