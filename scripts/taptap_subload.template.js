/* TapTap 分包懒加载垫片（零构建，仅注入发布包，不改动游戏源码） */
(function(){
  var PACKS = __PACKS_JSON__;
  var RX = PACKS.map(function(p){ return { name:p.name, re:new RegExp("^(?:"+p.re+")$") }; });
  function relOf(src){ if(!src||typeof src!=="string") return null; var m=src.match(/(img|audio|video|assets)\//); return m?src.slice(m.index):null; }
  // 外部/内联资源不得改写（http(s)、协议相对 //、data:、blob:）——守卫放在 packFor，
  // 使 img.src hook 的 ensure() 也一并通过（此前仅 _rw/_rwHTML 有守卫，ensure 会误改外部图）。
  function _ext(u){ return u.indexOf("http://")===0||u.indexOf("https://")===0||u.indexOf("//")===0||u.indexOf("data:")===0||u.indexOf("blob:")===0; }
  // 关键修复：globs 正则是 ^…$ 锚定，任何带 ?v= 缓存串或 #fragment 的 URL 都会整条失配 → 不被改写 → 404。
  // 故匹配前先剥掉 ?查询 / #片段（仅用于命中分包，路径本身仍保留原 query 以兼容缓存串）。
  function packFor(src){ if(!src||typeof src!=="string"||_ext(src)) return null; var r=relOf(src); if(!r) return null; var base=r.split('?')[0].split('#')[0]; for(var i=0;i<RX.length;i++){ if(RX[i].re.test(base)) return RX[i].name; } return null; }
  var pending={};
  function isTT(){ return !!(window.tt && window.tt.loadSubpackage); }
  function ensure(src){
    var name=packFor(src); if(!name) return null;
    var rel=relOf(src);
    if(isTT()){ if(pending[name]) return {p:pending[name], name:name, rel:rel}; pending[name]=new Promise(function(res){ try{ window.tt.loadSubpackage({name:name,success:function(){res();},fail:function(){res();}}); }catch(e){ res(); } }); return {p:pending[name], name:name, rel:rel}; }
    return {p:Promise.resolve(), name:name, rel:rel};
  }
  function applySrc(setter, self, v, e){ var url=isTT()?v:(e.name+"/"+e.rel); setter.call(self, url); }
  // 重写 url(...) 中的地址到分包路径（纯字符串处理，无正则转义、无 computed style，零额外开销）
  function _rw(str){
    if(!str||typeof str!=="string"||isTT()) return str;
    var out=""; var i=0;
    while(i<str.length){
      var p=str.indexOf("url(",i); if(p<0){ out+=str.slice(i); break; }
      out+=str.slice(i,p);
      var j=p+4; while(j<str.length && str[j]===" ") j++;
      var q=""; if(str[j]==='"'||str[j]==="'"){ q=str[j]; j++; }
      var st=j; while(j<str.length){ if(q){ if(str[j]===q) break; } else { if(str[j]===")") break; } j++; }
      var inner=str.slice(st,j); var n=packFor(inner);
      if(n && inner.indexOf(n+"/")!==0 && !(inner.indexOf("http")===0||inner.indexOf("//")===0||inner.indexOf("data:")===0||inner.indexOf("blob:")===0)){ out+= n+"/"+inner; } else { out+=inner; }
      i=j+1;
    }
    return out;
  }
  // 重写 HTML 字符串中的 url(...) 与 src="..." / src='...'（覆盖 innerHTML/outerHTML/insertAdjacentHTML 注入路径，
  // 因为浏览器解析 innerHTML 时内部赋值 src 不经过 HTMLImageElement.src setter hook）。
  function _rwHTML(str){
    if(!str||typeof str!=="string"||isTT()) return str;
    var out=""; var i=0; var n=str.length;
    while(i<n){
      var pu=str.indexOf("url(",i);
      var ps=str.indexOf("src=",i);
      var psu=str.indexOf("SRC=",i);
      if(psu>=0 && (ps<0||psu<ps)) ps=psu;
      if(pu>=0 && (ps<0||pu<ps)){
        out+=str.slice(i,pu);
        var j=pu+4; while(j<n&&str[j]===" ")j++;
        var q=""; if(str[j]==='"'||str[j]==="'"){ q=str[j]; j++; }
        var st=j; while(j<n){ if(q){ if(str[j]===q) break; } else { if(str[j]===")") break; } j++; }
        var inner=str.slice(st,j); var name=packFor(inner);
        if(name && inner.indexOf(name+"/")!==0 && !(inner.indexOf("http")===0||inner.indexOf("//")===0||inner.indexOf("data:")===0||inner.indexOf("blob:")===0)){ out+=name+"/"+inner; } else { out+=inner; }
        i=j+1;
      } else if(ps>=0){
        var prev = ps>0?str[ps-1]:' ';
        if(prev===' '||prev==='\t'||prev==='\n'||prev==='\r'||prev==='>'){
          out+=str.slice(i,ps);
          var k=ps+4; while(k<n&&str[k]===' ')k++;
          var q2=""; if(str[k]==='"'||str[k]==="'"){ q2=str[k]; k++; }
          var s2=k; while(k<n){ if(q2){ if(str[k]===q2) break; } else { if(str[k]===' '||str[k]==='>'||(str[k]==='/'&&str[k+1]==='>')) break; } k++; }
          var inner2=str.slice(s2,k); var nm=packFor(inner2);
          if(nm && inner2.indexOf(nm+"/")!==0 && !(inner2.indexOf("http")===0||inner2.indexOf("//")===0||inner2.indexOf("data:")===0||inner2.indexOf("blob:")===0)){ out+="src="+(q2?q2:'')+nm+"/"+inner2+(q2?q2:''); } else { out+=str.slice(ps,k); }
          i=k;
        } else { out+=str.slice(i,ps+4); i=ps+4; }
      } else { out+=str.slice(i); break; }
    }
    return out;
  }
  function _extractUrl(s){ var k=s.indexOf("url("); if(k<0) return null; var i=k+4; while(i<s.length && s[i]===" ") i++; var q=""; if(s[i]==='"'||s[i]==="'"){ q=s[i]; i++; } var start=i; while(i<s.length){ if(q){ if(s[i]===q) break; } else { if(s[i]===")") break; } i++; } return s.slice(start,i); }
  // 测试/调试句柄：暴露纯重写函数，供门禁 _verify_taptap_shim.js 单测（不改运行时行为）。
  try{ window.__ndxSubload={ rw:_rw, rwHTML:_rwHTML, packFor:packFor, relOf:relOf, isTT:isTT }; }catch(e){}
  try{
    var proto=window.HTMLImageElement&&window.HTMLImageElement.prototype;
    if(proto&&Object.getOwnPropertyDescriptor(proto,"src")){ var d=Object.getOwnPropertyDescriptor(proto,"src"); var set=d.set; Object.defineProperty(proto,"src",{configurable:true,get:d.get,set:function(v){ var self=this; var e=ensure(v); if(e){ e.p.then(function(){ applySrc(set, self, v, e); }); return; } return set.call(self,v); }}); }
    if(proto&&proto.setAttribute){ var sa=proto.setAttribute; proto.setAttribute=function(n,v){ var self=this; if((n==="src"||n==="SRC")){ var e=ensure(v); if(e){ e.p.then(function(){ applySrc(sa, self, v, e); }); return; } } return sa.call(self,n,v); }; }
    var mproto=window.HTMLMediaElement&&window.HTMLMediaElement.prototype;
    if(mproto&&Object.getOwnPropertyDescriptor(mproto,"src")){ var md=Object.getOwnPropertyDescriptor(mproto,"src"); var mset=md.set; Object.defineProperty(mproto,"src",{configurable:true,get:md.get,set:function(v){ var self=this; var e=ensure(v); if(e){ e.p.then(function(){ applySrc(mset, self, v, e); }); return; } return mset.call(self,v); }}); }
    // —— 音频构造形式 `new Audio(url)` 覆盖（实证漏洞，2026-09-26）——
    // 本轮用真实 Edge 实测（probe_audio_hook.js）：`new Audio(url)` 的构造参数在 Chromium 里
    // 走 C++ 内部 HTMLMediaElement::setSrc()，**既不经过上面的原型 src setter，也不经过 setAttribute**
    // → 上面两处 hook 对「构造形式」全部漏网（实测 setter 命中 = false）。
    // 而本作音频加载 100% 是构造形式：js/audio/mp3_player.js:38/76、js/sound.js:214/320/345/429、
    // js/intro_video.js:306 → 分包路径永不改写 → 真机 404（既有的 sub_audio 也早已是坏的）。
    // 修法：包装 window.Audio，让构造参数显式落到 el.src（走 setter 通道）。
    // ⚠ 时序：非 TT 环境目标前缀已知，故**同步**改写，保住 `new Audio(u); a.play()` 的立即播放语义；
    //    TT 真机必须等 loadSubpackage 返回，故先设原路径、就绪后再设一次。
    if(typeof window.Audio==="function"&&!window.Audio.__ndxWrapped){
      (function(_A,_mset){
        var W=function(src){
          var el=new _A();
          if(src===undefined||src===null) return el;
          var s=(typeof src==="string")?src:String(src);
          var e=ensure(s);
          if(!e){ try{ _mset.call(el,s); }catch(err){} return el; }
          if(!isTT()){ try{ _mset.call(el,e.name+"/"+e.rel); }catch(err){ try{_mset.call(el,s);}catch(err2){} } return el; }
          try{ _mset.call(el,s); }catch(err){}
          e.p.then(function(){ try{ _mset.call(el,s); }catch(err){} });
          return el;
        };
        W.prototype=_A.prototype;
        try{ Object.defineProperty(W,"name",{value:"Audio",configurable:true}); }catch(e){}
        try{ Object.defineProperty(W,"__ndxWrapped",{value:true,configurable:true}); }catch(e){}
        window.Audio=W;
      })(window.Audio, mset);
    }
    // —— CSS background-image 重写（高效、无 computed style 风暴）——
    // 游戏用 background-image / cssText 加载精灵帧与背景（内联字符串），垫片须同步重写到分包路径。
    // 仅 hook 赋值点：CSSStyleDeclaration 的 cssText/backgroundImage/background setter + setProperty + setAttribute('style')。
    // 零额外开销；另加一次性轻量扫描捕获初始内联背景。绝不扫描整棵子树/读 computed style（否则卡死页面）。
    var _csd=window.CSSStyleDeclaration&&window.CSSStyleDeclaration.prototype;
    if(_csd){
      ['cssText','backgroundImage','background'].forEach(function(pr){ var od=Object.getOwnPropertyDescriptor(_csd,pr); if(od&&od.set){ Object.defineProperty(_csd,pr,{configurable:true,get:od.get,set:function(v){ try{ return od.set.call(this,_rw(typeof v==="string"?v:"")); }catch(e){ return od.set.call(this,v); } }}); } });
      var _sp=_csd.setProperty; if(_sp){ _csd.setProperty=function(n,v){ if((n==="background-image"||n==="background")&&typeof v==="string"){ try{ return _sp.call(this,n,_rw(v)); }catch(e){} } return _sp.call(this,n,v); }; }
    }
    var _esa=window.Element&&window.Element&&window.Element.prototype&&window.Element.prototype.setAttribute;
    if(_esa){ window.Element.prototype.setAttribute=function(n,v){ if((n==="style"||n==="STYLE")&&typeof v==="string"&&v.indexOf("url(")>=0){ try{ return _esa.call(this,n,_rw(v)); }catch(e){} } return _esa.call(this,n,v); }; }
    // —— innerHTML / outerHTML / insertAdjacentHTML 注入路径重写（覆盖 <img src> 与内联 background-image）——
    // 浏览器解析 innerHTML 时内部赋值 src 不经过 HTMLImageElement.src setter，必须在此处提前改写字符串。
    var _ep=window.Element&&window.Element.prototype;
    if(_ep&&Object.getOwnPropertyDescriptor(_ep,"innerHTML")){ var id=Object.getOwnPropertyDescriptor(_ep,"innerHTML"); var iset=id.set; Object.defineProperty(_ep,"innerHTML",{configurable:true,get:id.get,set:function(v){ try{ return iset.call(this,_rwHTML(typeof v==="string"?v:"")); }catch(e){ return iset.call(this,v); } }}); }
    if(_ep&&Object.getOwnPropertyDescriptor(_ep,"outerHTML")){ var od2=Object.getOwnPropertyDescriptor(_ep,"outerHTML"); var oset=od2.set; Object.defineProperty(_ep,"outerHTML",{configurable:true,get:od2.get,set:function(v){ try{ return oset.call(this,_rwHTML(typeof v==="string"?v:"")); }catch(e){ return oset.call(this,v); } }}); }
    if(_ep&&_ep.insertAdjacentHTML){ var _iah=_ep.insertAdjacentHTML; _ep.insertAdjacentHTML=function(pos,html){ try{ return _iah.call(this,pos,_rwHTML(typeof html==="string"?html:"")); }catch(e){ return _iah.call(this,pos,html); } }; }
    // 一次性轻量扫描：仅针对「内联 style 含 url(」的元素（属性选择器，不读 computed style）
    setTimeout(function(){ try{ var all=document.querySelectorAll('[style*="url("]'); for(var i=0;i<all.length;i++){ var el=all[i]; var u=_extractUrl(el.style.backgroundImage||el.style.background||el.style.cssText||""); if(u){ var n=packFor(u); if(n&&u.indexOf(n+"/")!==0){ el.style.backgroundImage="url("+n+"/"+u+")"; } } } }catch(e){} }, 1800);
  }catch(e){}
})();
