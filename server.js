var recon = require('./recon')

var options = {
  game: 'bf3',
  host: '127.0.0.1',
  port: 47200,
  password: 'abcd1234',
  watchEvents: true,
  reconnect: true
}

recon.connect(options, function() {
  recon.send('serverInfo', function(response) {
    console.log(response)
  })
})

recon.on('connect', function() {
  console.log('connected')
})

recon.on('end', function() {
  console.log('ended')
})

recon.on('error', function(err) {
  console.log(err)
})

recon.on('player.*', function(response) {
  console.log(response)
})

recon.on('punkBuster.*', function(response) {
  console.log(response)
})

