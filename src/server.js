const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const config = require('./config.js');

const credentials = grpc.ServerCredentials.createSsl(
  config.cert.root.chain,
  [{
    private_key: config.cert.server.key,
    cert_chain: config.cert.server.chain,
  }],
  true,
);
const packageDefinition = protoLoader.loadSync(__dirname + '/chat.proto');
const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

const messageHistory = [];
const clients = new Map();

const main = () => {
  const server = new grpc.Server();
  server.addService(
    chatProto.ChatService.service,
    {
      join,
    },
  );
  server.bind(
    config.serverAddress,
    credentials,
  );
  server.start();
}

const join = (call) => {
  const clientId = Math.random().toString(32).slice(2, 6);

  const messageJoin = createSystemMessage(`${clientId} присоеденился к чату`);
  messageHistory.push(messageJoin);
  notifyMessageForAllClients(messageJoin);

  messageHistory.forEach(message => notifyMessage(message, call, clientId));

  clients.set(clientId, call);

  call
    .on('data', (data) => {
      const message = createMessage({ ...data, from: clientId });
      messageHistory.push(message);
      notifyMessageForAllClients(message);
    })
    .on('cancelled', () => {
      clients.delete(clientId);

      const messageLeave = createSystemMessage(`${clientId} покинул чат`);
      messageHistory.push(messageLeave);
      notifyMessageForAllClients(message);
    });
}

const createSystemMessage = text => createMessage({ from: 'system', text })

const createMessage = ({ from, to = '-1', text }) => ({
  from,
  text,
  to,
  timestamp: Date.now(),
})

const notifyMessageForAllClients = message =>
  clients.forEach((call, clientId) => notifyMessage(message, call, clientId));

const notifyMessage = (message, call, clientId) => {
  if (
    clientId === message.to
    || message.to === '-1' && clientId !== message.from
  ) {
    call.write(message);
  }
}

main();
