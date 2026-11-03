import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';

const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:false}});
app.use(express.static('public'));
const rooms=new Map();
const MAX_PLAYERS=12, WORLD=100, START_RADIUS=47, TICK=50;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const cleanRoom=v=>String(v??'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8)||'PUBLIC';
const name=v=>String(v??'Player').replace(/[<>]/g,'').trim().slice(0,18)||'Player';
const randomSpawn=()=>({x:(Math.random()-.5)*50,z:(Math.random()-.5)*50});
const getRoom=id=>{
 if(!rooms.has(id))rooms.set(id,{id,players:new Map(),bullets:[],started:Date.now(),kills:0});
 return rooms.get(id);
};
const serialize=p=>({id:p.id,name:p.name,x:p.x,z:p.z,yaw:p.yaw,hp:p.hp,kills:p.kills,alive:p.alive,color:p.color});
const circle=room=>({radius:Math.max(9,START_RADIUS-(Date.now()-room.started)/1000*.20),x:0,z:0});
const obstacleBoxes=[[-15,-14,9,8],[16,-17,10,9],[-20,17,12,8],[18,18,11,10],[0,4,8,9]];
const blocked=(x,z)=>obstacleBoxes.some(([cx,cz,w,h])=>Math.abs(x-cx)<w/2+0.7&&Math.abs(z-cz)<h/2+0.7);

io.on('connection',socket=>{
 socket.on('join',({room:rawRoom,playerName}={})=>{
  if(socket.data.room)return;
  const id=cleanRoom(rawRoom),room=getRoom(id);
  if(room.players.size>=MAX_PLAYERS){socket.emit('joinError','Phòng đã đủ 12 người.');return;}
  let pos=randomSpawn();for(let i=0;i<50&&blocked(pos.x,pos.z);i++)pos=randomSpawn();
  const p={id:socket.id,name:name(playerName),...pos,yaw:0,hp:100,kills:0,alive:true,color:`hsl(${Math.floor(Math.random()*360)},75%,58%)`,lastFire:0,lastMove:Date.now(),lastZone:Date.now()};
  room.players.set(socket.id,p);socket.data.room=id;socket.join(id);
  socket.emit('joined',{id:socket.id,room:id,world:WORLD,obstacles:obstacleBoxes});
  io.to(id).emit('notice',`${p.name} đã vào phòng`);
 });
 socket.on('move',data=>{
  const room=rooms.get(socket.data.room),p=room?.players.get(socket.id);if(!p||!p.alive||!data)return;
  const now=Date.now(),dt=clamp((now-p.lastMove)/1000,.01,.25),max=dt*12+0.5;
  const x=Number(data.x),z=Number(data.z),yaw=Number(data.yaw);
  if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(yaw))return;
  const dx=x-p.x,dz=z-p.z,dist=Math.hypot(dx,dz);
  if(dist<=max&&Math.abs(x)<WORLD/2&&Math.abs(z)<WORLD/2&&!blocked(x,z)){p.x=x;p.z=z;}
  p.yaw=yaw;p.lastMove=now;
 });
 socket.on('fire',data=>{
  const room=rooms.get(socket.data.room),p=room?.players.get(socket.id);if(!p?.alive)return;
  const now=Date.now();if(now-p.lastFire<230)return;p.lastFire=now;
  const yaw=Number(data?.yaw);if(!Number.isFinite(yaw))return;
  p.yaw=yaw;
  const dirX=Math.sin(yaw),dirZ=Math.cos(yaw);
  let best=null,bestT=Infinity;
  for(const target of room.players.values()){
   if(target.id===p.id||!target.alive)continue;
   const rx=target.x-p.x,rz=target.z-p.z,t=rx*dirX+rz*dirZ;
   if(t<0||t>60)continue;
   const perp=Math.abs(rx*dirZ-rz*dirX);
   if(perp<1.1&&t<bestT){best=target;bestT=t;}
  }
  // Reject hits passing through buildings.
  const endT=best?bestT:60;
  for(let t=0;t<endT;t+=.4){if(blocked(p.x+dirX*t,p.z+dirZ*t)){best=null;break;}}
  if(best){best.hp=Math.max(0,best.hp-20);io.to(room.id).emit('hit',{id:best.id,by:p.id});if(best.hp===0){best.alive=false;p.kills++;io.to(room.id).emit('notice',`${p.name} đã hạ ${best.name}`);}}
  io.to(room.id).emit('shot',{id:p.id,x:p.x,z:p.z,yaw:p.yaw,hit:best?.id??null});
 });
 socket.on('respawn',()=>{
  const room=rooms.get(socket.data.room),p=room?.players.get(socket.id);if(!p||p.alive)return;
  let pos=randomSpawn();for(let i=0;i<50&&blocked(pos.x,pos.z);i++)pos=randomSpawn();
  Object.assign(p,pos,{hp:100,alive:true,lastMove:Date.now()});
 });
 socket.on('disconnect',()=>{
  const room=rooms.get(socket.data.room);if(!room)return;
  const p=room.players.get(socket.id);room.players.delete(socket.id);
  if(p)io.to(room.id).emit('notice',`${p.name} đã rời phòng`);
  if(!room.players.size)rooms.delete(room.id);
 });
});
setInterval(()=>{
 for(const room of rooms.values()){
  const zone=circle(room),now=Date.now();
  for(const p of room.players.values()){
   if(!p.alive)continue;
   if(Math.hypot(p.x-zone.x,p.z-zone.z)>zone.radius&&now-p.lastZone>=1000){p.hp=Math.max(0,p.hp-6);p.lastZone=now;if(p.hp===0){p.alive=false;io.to(room.id).emit('notice',`${p.name} đã bị vòng bo hạ`);}}
  }
  io.to(room.id).emit('state',{players:[...room.players.values()].map(serialize),zone});
 }
},TICK);
const port=process.env.PORT||3000;
server.listen(port,'0.0.0.0',()=>console.log(`Last Circle 3D running on port ${port}`));
