var net = require('net'),
    binary = require('binary')

var refId = 0;

var commands = {}
var events = {}

var parseCmd = function(command) {
  var cmd = [];
  var args = command.split(' ')
  switch (args[0]) {
    case 'admin.say':
      cmd[0] = args[0];
      cmd[1] = args.slice(1, (args.length - 1)).join(' ');
      cmd[2] = args[args.length - 1]
      console.log(cmd)
      break;
    default:
      cmd = args;
  }
  return cmd;
}
var packet = {
  create: function(command, sequence) {
    var cmd = parseCmd(command),
        len = cmd.join('').length + 12 + (cmd.length * 5),
        b = new Buffer(len)

    if (!sequence) {
      refId += 1;
      id = refId
      commands[id] = {
        command: command,
        response: {}
      }
    } else {
      id = sequence
    }
    b.writeInt32LE(id, 0)
    b.writeInt32LE(len, 4)
    b.writeInt32LE(cmd.length, 8)
    var off = 12;
    for (var x in cmd) {
      var c = cmd[x]
      b.writeInt32LE(c.length, off)
      b.write(c, off + 4)
      b[off + 4 + c.length] = 0x00;
      off += c.length + 5
    }
    return b;
  }
}
var client = net.connect(47200, '127.0.0.1', function() {
  console.log('client connected');
  client.write(packet.create('version'))
  client.write(packet.create('serverInfo'))
  client.write(packet.create('listPlayers all'))
});
var response;
binary.stream(client)
  .loop(function(end) {
    this
      .word32le('id')
      .word32le('size')
      .word32le('wordCount')
      .tap(function(vars) {
        response = {
          id: vars.id & 0x3fffffff,
          event: !!(vars.id & 0x80000000),
          isResponse: !!(vars.id & 0x40000000),
          size: vars.size,
          wordCount: vars.wordCount,
          words: []
        }
        this
          .loop(function(_end) {
            this
              .word32le('wordLen')
              .buffer('word', 'wordLen')
              .tap(function(vars) {
                response.words.push(vars.word.toString())
                if (response.words.length === response.wordCount) {
                  _end()
                }
              })
              .skip(1)
            })
            .tap(function(vars) {
              if (!commands[response.id]) {
                events[response.id] = response;
              } else {
                commands[response.id].response = response;
              }
              console.log(response)
            })
      })
  })

client.on('end', function() {
  console.log('client disconnected');
});



