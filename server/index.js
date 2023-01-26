const { WebSocket, WebSocketServer } = require('ws');
const http = require('http');
const uuid4 = require('uuid').v4;

let subscribers = Object.create(null);

const server = http.createServer((req, res) => {
  if (req.method === 'POST' || req.url !== '/badges') {
    let message = '1';
    for (const id in subscribers) {
      subscribers[id].end(message);
      console.log('send to the subscriber: ' + id + ' message: ' + message)
    }
    subscribers = Object.create(null);
    res.end('ok');
    return;
  }

  if (req.method !== 'GET' || req.url !== '/badges') {
    res.writeHead(404, { "Content-Type": "application/json" }).end();
    return;
  }

  res.writeHead(200, {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache,must-revalidate",
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET'
  });
  const id = uuid4();
  subscribers[id] = res;
  req.on('close', () => {
    console.log(`${id} disconnected from LP`);
    delete subscribers[id]
  });

});
const wsServer = new WebSocketServer({ server });
const port = 8000;

server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`);
});

const clients = {};

wsServer.on('connection', (connection) => {
  const userId = uuid4();
  console.log(`Recieved a new connection.`);

  clients[userId] = connection;
  console.log(`${userId} connected.`);

  connection.on('message', () => {
    for(let userId in clients) {
      const client = clients[userId];
      if(client.readyState === WebSocket.OPEN) {
        client.send(1);
      }
    }
  });

  connection.on('close', (userId) => {
    delete clients[userId];
    console.log(`${userId} disconnected.`);
  });
});
