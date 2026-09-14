// 临时诊断：CDP 打开游戏页，输出 title/url/NDX 状态/console错误/截图
'use strict';
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const CHROME = 'C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.36/chrome.exe';
const URL = 'http://127.0.0.1:8090/index.html';
const PORT = 9334;
const PROFILE = path.join(os.tmpdir(), 'ndx_dbg_' + Date.now());

function getJSON(p){return new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},(r)=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej);});}
function wait(ms){return new Promise(r=>setTimeout(r,ms));}
class CDP{constructor(u){this.ws=new WebSocket(u);this.id=0;this.pending=new Map();this.handlers=[];this.ready=new Promise(r=>this.ws.onopen=r);this.ws.onmessage=ev=>this._m(JSON.parse(ev.data));}_m(m){if(m.id&&this.pending.has(m.id)){const{resolve,reject}=this.pending.get(m.id);this.pending.delete(m.id);m.error?reject(new Error(JSON.stringify(m.error))):resolve(m.result);} else if(m.method){this.handlers.forEach(h=>h(m));}}onEvent(h){this.handlers.push(h);}send(method,params={}){const id=++this.id;return new Promise((res,rej)=>{this.pending.set(id,{resolve:res,reject:rej});this.ws.send(JSON.stringify({id,method,params}));});}}

(async()=>{
  const chrome=spawn(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--remote-debugging-port='+PORT,'--user-data-dir='+PROFILE,'--no-first-run','--mute-audio','about:blank'],{stdio:'ignore'});
  try{
    let tabs; for(let i=0;i<60;i++){try{tabs=(await getJSON('/json/list')).filter(t=>t.type==='page'&&t.url!=='chrome://newtab/');if(tabs&&tabs.length)break;}catch(e){}await wait(250);}
    const cdp=new CDP(tabs[0].webSocketDebuggerUrl); await cdp.ready;
    await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Network.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,mobile:true,deviceScaleFactor:2});
    // 捕获 console / 异常 / 网络失败
    const logs=[];
    cdp.onEvent((m)=>{ if(m.method==='Runtime.consoleAPICalled'){logs.push('[console] '+m.params.type+': '+(m.params.args||[]).map(a=>a.value||a.description||'').join(' '));} if(m.method==='Runtime.exceptionThrown'){logs.push('[exception] '+(m.params.exceptionDetails.exception&&m.params.exceptionDetails.exception.description||m.params.exceptionDetails.text));} if(m.method==='Network.loadingFailed'){logs.push('[netfail] '+(m.params.errorText||'')+' '+(m.params.blockedReason||''));} });
    await cdp.send('Page.navigate',{url:URL});
    await wait(6000);
    const ev=`(function(){return {href:location.href, title:document.title, hasNDX:!!window.NDX, hasGame:!!(window.NDX&&window.NDX.game), bodyLen:document.body?document.body.innerHTML.length:0, domNodes:document.getElementsByTagName('*').length, resCount:performance.getEntriesByType('resource').length, scriptCount:document.querySelectorAll('script').length, hasSkeleton:!!document.querySelector('.skeleton-frame'), hasStart:!!document.getElementById('startscreen'), loadingScreenShowing:(window.NDX&&window.NDX.loadingScreen)?window.NDX.loadingScreen.isShowing():null};})()`;
    const r=await cdp.send('Runtime.evaluate',{expression:ev,returnByValue:true});
    console.log('PAGE:',JSON.stringify(r.result.value,null,2));
    console.log('--- LOGS (tail) ---'); logs.slice(-40).forEach(l=>console.log(l));
    const shot=await cdp.send('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(__dirname,'_perf_dbg.png'),Buffer.from(shot.data,'base64'));
    console.log('截图已存 scripts/_perf_dbg.png');
    cdp.ws.close();
  } finally { try{chrome.kill();}catch(e){} setTimeout(()=>{try{fs.rmSync(PROFILE,{recursive:true,force:true});}catch(e){}},500);}
})().catch(e=>{console.error('FATAL',e);process.exit(1);});
