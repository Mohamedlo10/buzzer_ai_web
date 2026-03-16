const WebSocket = require('ws');

const ws = new WebSocket('ws://192.168.1.32:8080/ws/000/test4/websocket');
let subId = 0;

ws.on('open', () => console.log('OPEN'));

ws.on('message', (d) => {
  const msg = d.toString();
  console.log('MSG:', msg.substring(0, 300));
  
  if (msg === 'o') {
    const frame = 'CONNECT\naccept-version:1.1,1.2\nheart-beat:10000,10000\n\n\0';
    ws.send(JSON.stringify([frame]));
    console.log('SENT: STOMP CONNECT');
  }
  
  if (msg.includes('CONNECTED')) {
    const sessionId = '70e147ee-2054-4769-8b32-5e721170d5b6';
    const topics = ['status', 'players', 'question', 'buzz', 'score', 'buzzer-reset', 'game-over', 'generating'];
    topics.forEach(t => {
      subId++;
      const sub = 'SUBSCRIBE\nid:sub-' + subId + '\ndestination:/topic/session/' + sessionId + '/' + t + '\n\n\0';
      ws.send(JSON.stringify([sub]));
    });
    console.log('SENT: SUBSCRIBE to', topics.length, 'topics');
  }
});

ws.on('error', (e) => console.log('ERR:', e.message));
ws.on('close', (c, r) => console.log('CLOSE:', c, r ? r.toString() : ''));

setTimeout(() => { 
  console.log('Timeout — closing');
  ws.close(); 
  process.exit(); 
}, 15000);
