var net = require('net'),
    util = require('util'),
    EventEmitter = require('eventemitter2').EventEmitter2


var client, recon, protocol, sequenceId = 0;

var Recon = EventEmitter;

Recon.prototype._write = function(command, cb) {
  var packet = protocol.create(command);
  client.write(packet.buffer)
  recon.once('response.' + packet.id, function(response) {
    cb(protocol.types(response, command.split(' ')[0]))
  })
}

Recon.prototype.send = function(command, cb) {
  recon._write(command, function(response) {
    if (response.status !== 'OK') {
      return recon.emit('_error', response.status)
    }

    if (cb) cb(response)
  })
}

Recon.prototype.connect = function(opts, cb) {
  protocol = require('./' + opts.game + '_protocol')
  client = net.connect(opts.port, opts.host)
  
  client.on('connect', connect);

  protocol.parse(client, function(response) {
    if (response.event) {
      recon.emit('event', response)
    } else {
      recon.emit('response.' + response.id, response)
    }
  })

  client.on('close', function() {
    recon.emit('end')
    if (opts.reconnect) {
      reconnect()
    }
  });

  client.on('error', function(err) {
    console.log(err)
  })

  recon.on('event', function(response) {
    recon.emit(response.words[0], {command: response.words[0], response: protocol.types(response)})
  })

  recon.on('_error', function(err) {
    recon.emit('error', err)
  })

  function reconnect() {
    setTimeout(function() {
      client.connect(opts.port, opts.host)
    }, 4*1000)
  }

  function connect() {
    if (opts.password) {
      protocol.auth(recon, opts.password)
    }

    recon.once('authed', function(response) {
      if (opts.password && opts.watchEvents) {
        recon.send('admin.eventsEnabled true')
      }
      recon.emit('connect')
      cb()
    })
  }

}

Recon.prototype.end = function() {
  client.end()
}


recon = module.exports = new Recon({wildcard: true})
