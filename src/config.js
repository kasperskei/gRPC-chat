const fs = require('fs');

const readCertFile = (filename) => fs.readFileSync(`${__dirname}/../cert/${filename}`)

module.exports = Object.freeze({
  serverAddress: process.env.SERVER_ADDRESS,
  cert: {
    root: {
      chain: readCertFile('ca.crt'),
      key: readCertFile('ca.key'),
    },
    client: {
      chain: readCertFile('server.crt'),
      key: readCertFile('server.key'),
    },
    server: {
      chain: readCertFile('server.crt'),
      key: readCertFile('server.key'),
    },
  },
});
