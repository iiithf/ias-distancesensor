const $svg = document.querySelector('#svg');
const $img = document.querySelector('nav img');
const s = Snap('#svg');

const SUBMARINE = $img.getAttribute('src');
const REQUESTRATE = 1000;
const DISTANCEMAX = 1000;
var width, height;
var mouse = {x: 0, y: 0};
var submarine, depth = DISTANCEMAX;
var mtime = new Date().getTime();



function svgSetup() {
  width = $svg.clientWidth;
  height = $svg.clientHeight;
}

function oceanCreate() {
  var water = s.rect(0, 0.1*height, width, height);
  water.attr({fill: 'lightblue'});
  var floor = s.rect(0, 0.9*height, width, height);
  floor.attr({fill: 'brown'});
  return s.group(water, floor);
}

function submarineCreate() {
  var x0 = 0.5*width, y0 = 0.1*height, w = y0;
  var image = s.image(SUBMARINE, x0, y0, w, w);
  var text = s.text(x0, y0, '?');
  var group = s.group(image, text);
  return Object.assign(group, {image, text});
}

function submarineUpdate(submarine, options) {
  var s = submarine, o = options;
  var ry = 1-o.distance/DISTANCEMAX, y = 0.7*ry*height;
  s.animate({transform: `t0,${y}`}, REQUESTRATE);
  s.text.attr({text: Math.floor(o.distance)+' '+o.unit});
}

function setup() {
  svgSetup();
  oceanCreate();
  submarine = submarineCreate();
}

async function onInterval() {
  var o = await m.request({method: 'GET', url: '/status'});
  submarineUpdate(submarine, o);
  var t = new Date().getTime();
  if(t-mtime>5000) return;
  var speed = 10*(0.5-mouse.y);
  var distance = o.distance+speed;
  console.log('POST', distance);
  m.request({method: 'POST', url: '/status', data: {distance}});
}

function onMouseMove(e) {
  mouse.x = e.clientX/width;
  mouse.y = e.clientY/height;
  mtime = new Date().getTime();
}

setInterval(onInterval, REQUESTRATE);
document.onmousemove = onMouseMove;
document.onresize = svgSetup;
setup();
