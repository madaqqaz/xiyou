// headless 模拟：自动游玩第一章，验证数值平衡与通关链路
const fs = require('fs');
const base = 'C:/Users/马达/Desktop/新建文件夹/西游/demo/js/';
let code = '';
['data.js', 'combat.js', 'game.js'].forEach((f) => {
  code += fs.readFileSync(base + f, 'utf8') + '\n';
});

code += `
function run(strategy){
  const g = new NDX.Game();
  g.start('wukong');
  let guard = 0;
  while(!g.state.over && guard++ < 3000){
    const p = g.state.pending;
    if(p.kind==='choices'){
      const ch = g.choices();
      if(!ch.length) break;
      const pick = strategy.pick(ch, g);
      g.chooseNext(pick.layer, pick.col);
    } else if(p.kind==='tiyuan'){ strategy.tiyuan(g); }
    else if(p.kind==='event'){ g.applyEventOpt(p.opts[0]); }
    else if(p.kind==='branch'){ g.applyBranchOpt(p.opts[0]); }
    else if(p.kind==='equip'){ g.chooseEquip(p.items[0].id); }
    else if(p.kind==='shop'){ g.leaveShop(); }
    else if(p.kind==='bossreward'){ g.chooseBossReward(p.items[0].id); }
    else break;
  }
  const r = g.state.over;
  return { win: r && r.win, reason: r && r.reason, rank: r && r.result && r.result.rank,
           hp: g.state.hp, equips: g.state.equips.length, layer: g.state.layer, guard };
}

// 策略A：走最左可去节点 + 总选【体】
const A = { pick:(ch)=>ch[0], tiyuan:(g)=>g.applyTiyuan(NDX.TIYUAN_OPTS[0]) };
// 策略B：走最右 + 总选【愿】
const B = { pick:(ch)=>ch[ch.length-1], tiyuan:(g)=>g.applyTiyuan(NDX.TIYUAN_OPTS[1]) };
// 策略C：中间优先(取length-1或更中) + 体愿交替
const C = { pick:(ch)=>{ const m=Math.floor(ch.length/2); return ch[m]; },
            tiyuan:(g)=>{ g._t=(g._t||0)+1; g.applyTiyuan(NDX.TIYUAN_OPTS[g._t%2]); } };

console.log('策略A(左·体):', JSON.stringify(run(A)));
console.log('策略B(右·愿):', JSON.stringify(run(B)));
console.log('策略C(中·交替):', JSON.stringify(run(C)));
`;
eval(code);
