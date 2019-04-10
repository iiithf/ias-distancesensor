const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');



const DATARATE = 1000;
const DEPTHMIN = 0;
const DEPTHMAX = 1000;
const DEPTHLOW = 200;
const DEPTHLOWP = 0.1;
const E = process.env;
const PORT = parseInt(E['PORT']||'8000');
const ASSETS = path.join(__dirname, 'assets');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});
var depth = 0, state = null;
var dtime = new Date().getTime();
var mtime = new Date().getTime();



function within(value, begin, end) {
  return Math.max(begin, Math.min(value, end));
}



function depthSetup() {
  return {depth: DEPTHMAX, speed: 0, low: 0, total: 0};
}
state = depthSetup();

function depthGenerate(state, accel=Math.random()) {
  var s = state;
  s.total++;
  if(s.depth<DEPTHLOW) s.low++;
  var lowp = s.low/s.total;
  s.speed += lowp<DEPTHLOWP? -accel:accel;
  s.depth += s.speed;
  if(s.depth<DEPTHMIN || s.depth>DEPTHMAX) s.speed = -s.speed;
  s.depth = within(s.depth, DEPTHMIN, DEPTHMAX);
  return s.depth;
}

function onInterval() {
  var t = new Date().getTime();
  var auto = t-mtime>DATARATE*2;
  depth = auto? depthGenerate(state):state.depth;
  dtime = new Date().getTime();
}
setInterval(onInterval, DATARATE);



app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use((req, res, next) => {
  Object.assign(req.body, req.query);
  var {ip, method, url, body} = req;
  if(method!=='GET') console.log(ip, method, url, body);
  next();
});

app.get('/status', (req, res) => {
  res.json({time: new Date(dtime), distance: depth});
});
app.post('/status', (req, res) => {
  var {distance} = req.body;
  mtime = new Date().getTime();
  state.depth = distance;
});

app.use(express.static(ASSETS, {extensions: ['html']}));
app.use((err, req, res, next) => {
  console.log(err, err.stack);
  res.status(err.statusCode||500).send(err.json||err);
});
server.listen(PORT, () => {
  console.log('DISTANCESENSOR running on '+PORT);
});
