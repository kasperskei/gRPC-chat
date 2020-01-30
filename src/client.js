const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const readline = require('readline');

const config = require('./config.js')

const credentials = grpc.credentials.createSsl(
  config.cert.root.chain,
  config.cert.client.key,
  config.cert.client.chain,
);
const packageDefinition = protoLoader.loadSync(__dirname + '/chat.proto');
const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

const client = new chatProto.ChatService(
  config.serverAddress,
  credentials,
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '',
});

const chatStream = client.join();
chatStream.on('data', (message) => {
  const to = message.to === '-1' ? 'все' : message.to;
  const time = new Date(message.timestamp).toLocaleTimeString();
  const text = `>>> ${message.text}
    От кого: ${message.from}
    Кому: ${to}
    Время отправления: ${time}
  `;

  const prev = rl.line;
  rl.write(null, { ctrl: true, name: 'u' });
  readline.clearLine();
  console.log(text);
  rl.write(prev);
});

rl.on('line', (line) => {
  const toMatch = (line.trim().match(/^\B@\w*/) || [''])[0];
  const to = toMatch.slice(1) || '-1';
  const text = line.replace(toMatch, '').trim();
  chatStream.write({ to, text })
});
