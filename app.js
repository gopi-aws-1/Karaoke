import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const $ = id => document.getElementById(id);
const say = message => { $('status').textContent = message; };
const saved = JSON.parse(localStorage.getItem('skyduet-settings') || '{}');
$('supa-url').value = saved.url || '';
$('supa-key').value = saved.key || '';
$('nickname').value = localStorage.getItem('skyduet-name') || '';
$('save-settings').onclick = () => { localStorage.setItem('skyduet-settings',JSON.stringify({url:$('supa-url').value.trim(), key:$('supa-key').value.trim()})); say('Saved on this device. Both partners need the same Supabase project.'); };
$('join').onclick = () => { $('joinrow').hidden = false; $('code').focus(); };
let channel, client, peer, media, roomCode, isHost=false, pendingCandidates=[], lines=[], times=[], playing=false, startAt=0, elapsed=0, raf=0, remotePresent=false, roomStart=0, roomTimer=null;
const randomCode = () => {const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const bytes=crypto.getRandomValues(new Uint8Array(6));return [...bytes].map(n=>chars[n%chars.length]).join('');};
function config(){ const url=$('supa-url').value.trim(), key=$('supa-key').value.trim();if(!/^https:\/\/.+\.supabase\.co\/?$/.test(url)||!key) throw new Error('Add a valid Supabase project URL and public anon/publishable key in Connection settings.');return {url,key};}
async function signal(type,payload){if(channel) await channel.send({type:'broadcast',event:'signal',payload:{type,payload,from:sessionId}});}
const sessionId=crypto.randomUUID();
async function enter(code,hosting){
 try{const cfg=config();roomCode=code;isHost=hosting;localStorage.setItem('skyduet-name',$('nickname').value.trim());client=createClient(cfg.url,cfg.key,{auth:{persistSession:false}});
  media=await navigator.mediaDevices.getUserMedia({video:true,audio:true});$('local').srcObject=media;
  channel=client.channel('skyduet-'+roomCode,{config:{broadcast:{self:false},presence:{key:sessionId}}});
  channel.on('broadcast',{event:'signal'},async ({payload:m})=>{if(m.from===sessionId)return;try{await receive(m);}catch(e){console.error(e);$('presence').textContent='Connection issue: '+e.message;}});
  channel.on('presence',{event:'sync'},()=>{const users=Object.keys(channel.presenceState()).filter(x=>x!==sessionId);remotePresent=users.length>0;$('presence').textContent=remotePresent?'Your person is here ♡':'Waiting for your person…';});
  await new Promise((resolve,reject)=>{channel.subscribe(async s=>{if(s==='SUBSCRIBED'){await channel.track({name:$('nickname').value.trim()||'Someone'});resolve();}else if(s==='CHANNEL_ERROR'||s==='TIMED_OUT')reject(new Error('Realtime channel did not connect. Check your Supabase settings.'));});});
  roomStart=Date.now();roomTimer=setInterval(()=>{const s=Math.floor((Date.now()-roomStart)/1000);$('together-time').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;},1000);$('setup').hidden=true;$('intro')?.remove();$('room').hidden=false;$('roomcode').textContent=roomCode;history.replaceState(null,'',location.pathname+'#'+roomCode);
  if(!isHost) await signal('hello',{});
 }catch(e){say(e.message);if(media){media.getTracks().forEach(t=>t.stop());media=null;}if(channel){await client?.removeChannel(channel);channel=null;}}
}
async function makePeer(){if(peer)return;peer=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]});media.getTracks().forEach(track=>peer.addTrack(track,media));peer.ontrack=e=>{$('remote').srcObject=e.streams[0];};peer.onicecandidate=e=>{if(e.candidate)signal('ice',e.candidate.toJSON());};peer.onconnectionstatechange=()=>{$('presence').textContent=peer.connectionState==='connected'?'Connected ♡':`Call: ${peer.connectionState}`;};}
async function receive(m){switch(m.type){
case 'hello':if(isHost){await makePeer();const offer=await peer.createOffer();await peer.setLocalDescription(offer);await signal('offer',offer);if(lines.length)await signal('lyrics',{english:$('enlyrics').value,telugu:$('telyrics').value,title:$('song-title').value,times,speed:$('speed').value});}break;
case 'offer':if(!isHost){await makePeer();await peer.setRemoteDescription(m.payload);await flushCandidates();const answer=await peer.createAnswer();await peer.setLocalDescription(answer);await signal('answer',answer);}break;
case 'answer':if(isHost&&peer){await peer.setRemoteDescription(m.payload);await flushCandidates();}break;
case 'ice':if(peer?.remoteDescription)await peer.addIceCandidate(m.payload);else pendingCandidates.push(m.payload);break;
case 'lyrics':$('enlyrics').value=m.payload.english||'';$('telyrics').value=m.payload.telugu||'';$('song-title').value=m.payload.title||'';$('speed').value=m.payload.speed||'2200';times=m.payload.times||[];rebuild();reset(false);break;
case 'play':elapsed=m.payload.elapsed||0;startAt=performance.now();playing=true;tick();break;
case 'pause':elapsed=m.payload.elapsed||0;playing=false;cancelAnimationFrame(raf);render();break;
case 'restart':reset(false);break;
case 'language':$('language').value=m.payload;rebuild();break;
case 'heart':showHeart();break;
case 'note':showNote(m.payload);break;
}}
async function flushCandidates(){for(const c of pendingCandidates)await peer.addIceCandidate(c);pendingCandidates=[];}
$('create').onclick=()=>enter(randomCode(),true);$('connect').onclick=()=>{const c=$('code').value.trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(c)){say('Please enter a six-character room code.');return;}enter(c,false);};
const fragment=location.hash.slice(1).toUpperCase();if(/^[A-Z2-9]{6}$/.test(fragment)){$('joinrow').hidden=false;$('code').value=fragment;}
$('copy').onclick=async()=>{const link=location.origin+location.pathname+'#'+roomCode;try{await navigator.clipboard.writeText(link);$('copy').textContent='Copied ✓';setTimeout(()=>$('copy').textContent='Copy invite',1800);}catch{$('copy').textContent=roomCode;}};
$('leave').onclick=()=>{clearInterval(roomTimer);channel?.unsubscribe();peer?.close();media?.getTracks().forEach(t=>t.stop());location.href=location.pathname;};
$('mic').onclick=()=>{const t=media?.getAudioTracks()[0];if(t){t.enabled=!t.enabled;$('mic').textContent=t.enabled?'🎤 Mute mic':'🔇 Unmute mic';}};
$('camera').onclick=()=>{const t=media?.getVideoTracks()[0];if(t){t.enabled=!t.enabled;$('camera').textContent=t.enabled?'📹 Camera off':'📷 Camera on';}};
$('blur').onclick=()=>{$('stage')?.classList.toggle('blurred');$('blur').textContent=$('stage').classList.contains('blurred')?'☁ Unblur backdrop':'☁ Blur backdrop';};
function getLines(){return ($('language').value==='telugu'&&$('telyrics').value.trim() ? $('telyrics').value : $('enlyrics').value).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);}
function rebuild(){lines=getLines();render();}
function indexAt(ms){if(!lines.length)return -1;if(times.length===lines.length){let i=0;while(i<times.length-1&&ms>=times[i+1])i++;return i;}return Math.min(lines.length-1,Math.floor(ms/Number($('speed').value)));}
function render(){const index=indexAt(elapsed);$('prevline').textContent=index>0?lines[index-1]:'';$('activeline').textContent=index>=0?lines[index]:'Choose a song to begin ♫';$('nextline').textContent=index>=0&&index+1<lines.length?lines[index+1]:'';}
function tick(){if(!playing)return;elapsed=performance.now()-startAt;render();const duration=times.length===lines.length?(times.at(-1)+Number($('speed').value)):lines.length*Number($('speed').value);if(elapsed>=duration){playing=false;return;}raf=requestAnimationFrame(tick);}
function reset(send=true){playing=false;cancelAnimationFrame(raf);elapsed=0;render();if(send)signal('restart',{});}
$('load').onclick=()=>{rebuild();reset();signal('lyrics',{english:$('enlyrics').value,telugu:$('telyrics').value,title:$('song-title').value,times,speed:$('speed').value});};
$('start').onclick=()=>{if(!lines.length){rebuild();if(!lines.length)return;}startAt=performance.now();playing=true;tick();signal('play',{elapsed});};
$('pause').onclick=()=>{if(playing)elapsed=performance.now()-startAt;playing=false;cancelAnimationFrame(raf);render();signal('pause',{elapsed});};
$('restart').onclick=()=>reset();
$('language').onchange=()=>{rebuild();signal('language',$('language').value);};$('speed').onchange=()=>{render();};
$('lrcfile').onchange=async e=>{const file=e.target.files[0];if(!file)return;const text=await file.text();const parsed=[];for(const row of text.split(/\r?\n/)){const m=row.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);if(m)parsed.push({at:(Number(m[1])*60+Number(m[2]))*1000,text:m[3].trim()});}if(parsed.length){$('enlyrics').value=parsed.map(x=>x.text).join('\n');times=parsed.map(x=>x.at);}else{$('enlyrics').value=text;times=[];}rebuild();reset();signal('lyrics',{english:$('enlyrics').value,telugu:$('telyrics').value,title:$('song-title').value,times,speed:$('speed').value});};
$('audiofile').onchange=e=>{const f=e.target.files[0];if(!f)return;$('audio').src=URL.createObjectURL(f);$('audio').hidden=false;};
window.addEventListener('beforeunload',()=>{media?.getTracks().forEach(t=>t.stop());peer?.close();});

// Couple moments — no microphone recordings or messages are stored on a server.
function showHeart(){const heart=document.createElement('span');heart.className='floating-heart';heart.textContent=['💙','🩵','💗','✨'][Math.floor(Math.random()*4)];heart.style.setProperty('--x',`${15+Math.random()*70}%`);$('hearts').appendChild(heart);setTimeout(()=>heart.remove(),2800);}
function showNote(payload){if(typeof payload !== 'string')return;const note=payload.trim().slice(0,180);if(note){$('note-display').textContent='💌 '+note;}}
$('heart').onclick=()=>{showHeart();signal('heart',{});};
$('send-note').onclick=()=>{const note=$('note-input').value.trim();if(!note)return;showNote(note);signal('note',note);$('note-input').value='';};
$('note-input').addEventListener('keydown',e=>{if(e.key==='Enter'){$('send-note').click();}});
$('song-title').addEventListener('input',()=>{$('song-now').textContent='♫ '+($('song-title').value.trim().slice(0,65)||'Our little concert');});