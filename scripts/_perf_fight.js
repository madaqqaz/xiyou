// 战斗界面性能测试 v2 —— 所有 CDP 调用带超时；采样 DOM/heap/Performance metrics
'use strict';
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const CHROME = 'C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.36/chrome.exe';
const URL = 'http://127.0.0.1:8090/index.html';
const PORT = 9336;
const PROFILE = path.join(os.tmpdir(), 'ndx_fight2_' + Date.now());
const AUTOPLAY = fs.readFileSync(path.join(__dirname, '_autoplay_inject.js'), 'utf8');

function getJSON(p){return new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},(r)=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej);});}
function wait(ms){return new Promise(r=>setTimeout(r,ms));}
function withTimeout(promise,ms,label){return Promise.race([promise,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout:'+label)),ms))]);}
class CDP{constructor(u){this.ws=new WebSocket(u);this.id=0;this.pending=new Map();this.ready=new Promise(r=>this.ws.onopen=r);this.ws.onmessage=ev=>this._m(JSON.parse(ev.data));}_m(m){if(m.id&&this.pending.has(m.id)){const{resolve,reject}=this.pending.get(m.id);this.pending.delete(m.id);m.error?reject(new Error(JSON.stringify(m.error))):resolve(m.result);}}send(method,params={}){const id=++this.id;return new Promise((res,rej)=>{this.pending.set(id,{resolve:res,reject:rej});this.ws.send(JSON.stringify({id,method,params}));});}}
async function ev(cdp,expr){const r=await withTimeout(cdp.send('Runtime.evaluate',{expression:expr,returnByValue:true}),8000,'eval');if(r.exceptionDetails)return{__err:r.exceptionDetails.exception&&r.exceptionDetails.exception.description||r.exceptionDetails.text};return r.result.value;}

(async()=>{
  const chrome=spawn(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--remote-debugging-port='+PORT,'--user-data-dir='+PROFILE,'--no-first-run','--mute-audio','about:blank'],{stdio:'ignore'});
  try{
    let tabs;for(let i=0;i<60;i++){try{tabs=(await getJSON('/json/list')).filter(t=>t.type==='page'&&t.url!=='chrome://newtab/');if(tabs&&tabs.length)break;}catch(e){}await wait(250);}
    const cdp=new CDP(tabs[0].webSocketDebuggerUrl);await cdp.ready;
    await cdp.send('Page.enable');await cdp.send('Runtime.enable');await cdp.send('Network.enable');await cdp.send('Performance.enable');
    await cdp.send('Network.setBlockedURLs',{urls:['*sw.js*']});
    await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,mobile:true,deviceScaleFactor:2});
    await cdp.send('Page.navigate',{url:URL});

    console.log('等待 start 界面...');
    let ready=false;
    for(let i=0;i<80;i++){await wait(150);try{const s=await ev(cdp,`(function(){var g=window.NDX&&window.NDX.game;var showing=window.NDX&&window.NDX.loadingScreen&&window.NDX.loadingScreen.isShowing&&window.NDX.loadingScreen.isShowing();return {game:!!g, showing:!!showing, gone:!document.getElementById('ndx-loading-screen')};})()`);if(s&&s.game&&!s.showing&&s.gone){ready=true;break;}}catch(e){}}
    if(!ready){console.log('start 界面未就绪');process.exit(1);}
    console.log('start 就绪，注入 autoplay');
    await ev(cdp, AUTOPLAY);

    // 等进入战斗
    let inFight=false;
    for(let i=0;i<160;i++){await wait(300);try{const s=await ev(cdp,`(function(){var g=window.NDX&&window.NDX.game;if(!g||!g.state)return{inFight:false};var p=g.state.pending||{};return{inFight:p.kind==='fight'};})()`);if(s&&s.inFight){inFight=true;break;}}catch(e){}}
    if(!inFight){console.log('未进入战斗');process.exit(1);}
    console.log('已进入战斗，采样...');

    async function metrics(){
      const m=await withTimeout(cdp.send('Performance.getMetrics'),8000,'metrics');
      const obj={};(m.metrics||[]).forEach(x=>obj[x.name]=x.value);
      return obj;
    }
    async function domState(){return await ev(cdp,`(function(){var m=performance.memory||{};return {dom:document.getElementsByTagName('*').length, heapMB:m.usedJSHeapSize?+(m.usedJSHeapSize/1048576).toFixed(2):null, docs:document.querySelectorAll('img').length};})()`);}

    const out={};
    out.pre = await domState();
    out.preMetrics = await metrics();
    // 战斗中采 3 次
    out.fight=[];
    for(let i=0;i<3;i++){
      await wait(1500);
      const ds=await domState();
      const mt=await metrics();
      out.fight.push({dom:ds.dom, heapMB:ds.heapMB, imgs:ds.imgs, nodes:mt.Nodes, jsmb:mt.JSHeapUsedSize?+(mt.JSHeapUsedSize/1048576).toFixed(2):null, taskCount:mt.Timestamp, scriptDur:mt.ScriptDuration?+mt.ScriptDuration.toFixed(3):null, layoutCount:mt.LayoutCount?mt.LayoutCount:null, recalcStyleCount:mt.RecalcStyleCount?mt.RecalcStyleCount:null});
      console.log(`  采样${i+1}: DOM=${ds.dom} heap=${ds.heapMB}MB nodes=${mt.Nodes} layout=${mt.LayoutCount} recalc=${mt.RecalcStyleCount}`);
    }
    await wait(1500);
    out.post = await domState();

    const shot=await withTimeout(cdp.send('Page.captureScreenshot',{format:'png'}),8000,'shot');
    fs.writeFileSync(path.join(__dirname,'_perf_fight.png'),Buffer.from(shot.data,'base64'));
    fs.writeFileSync(path.join(__dirname,'_perf_fight_out.json'),JSON.stringify(out,null,2));
    console.log('\n=== 战斗性能汇总 ===');
    console.log('战斗前:',JSON.stringify(out.pre));
    console.log('战斗后:',JSON.stringify(out.post));
    console.log('已存 _perf_fight_out.json / _perf_fight.png');
    cdp.ws.close();
  } finally{try{chrome.kill();}catch(e){} setTimeout(()=>{try{fs.rmSync(PROFILE,{recursive:true,force:true});}catch(e){}},500);}
})().catch(e=>{console.error('FATAL',e.message);try{chrome&&chrome.kill();}catch(e2){}process.exit(1);});
