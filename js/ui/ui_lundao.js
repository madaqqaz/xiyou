/* =============================================================================
 * 逆道西行 · 二周目论道浮层（P1-6 · V8.63）
 * -----------------------------------------------------------------------------
 * lundaoHtml(s)：按 s._lundaoStep 渲染 序章/三问/兑现/三选 四段式浮层。
 * 由 ui_core.js gameover 分支在论道进行中拦截调用；按钮 data-action 走 main.js
 * 的 lundao-continue / lundao-answer / lundao-choose 派发（方法在 game_lundao.js）。
 * 样式复用 reward-overlay / reward-modal / opt-btn 既有类，零新增 CSS。
 * ========================================================================== */
(function () {
  if (!window.NDX) window.NDX = {};
  var NDX = window.NDX;

  Object.assign(NDX.ui, {
    lundaoHtml(s) {
      const L = NDX.LUNDAO || {};
      const step = s._lundaoStep;
      const _br = (t) => String(t || '').replace(/\n/g, '<br>');
      const _card = (title, sub, bodyHtml) => `
        <div class="scene-overlay reward-overlay"><div class="scene-modal reward-modal lundao-modal" data-stop>
          <div class="panel-title"><span class="panel-corner">论</span>${title}</div>
          <div class="panel-body">${sub || ''}${bodyHtml || ''}</div>
        </div></div>`;

      // —— 序章 ——
      if (step === 0) {
        return _card(L.introTitle || '论道 · 旧账簿', '',
          `<p class="lundao-text">${_br(L.intro)}</p>
           <button class="opt-btn" data-action="lundao-continue">翻 开 账 簿 ▸</button>`);
      }

      // —— 三问（step 1-3）——
      if (step >= 1 && step <= 3) {
        const q = (L.questions || [])[step - 1];
        if (!q) return this.deathScreen(s);
        const optsHtml = (q.opts || []).map((o, i) => `
          <button class="opt-btn lundao-opt" data-action="lundao-answer" data-idx="${i}">
            【${o.dao}】${o.text}
          </button>`).join('');
        return _card(`${L.introTitle || '论道'} · 第${['一', '二', '三'][step - 1]}问`,
          `<p class="lundao-q">${q.title}</p><p class="lundao-sub">${q.sub}</p>`,
          `<div class="lundao-opts">${optsHtml}</div>
           <p class="lundao-hint">作答不入善恶账，只落笔调——账簿条目随你改写。</p>`);
      }

      // —— 兑现（step 4）——
      if (step === 4) {
        const ins = (s.lundaoCash && s.lundaoCash.insights) || [];
        const list = ins.length
          ? ins.map((n) => `<span class="lundao-insight">「${n}」→ 命数铭文 · 逆道烙印（体攻+4% 愿伤+4%）</span>`).join('')
          : '<span class="lundao-insight">账簿空空——此世逆道无所录，亦无所兑。</span>';
        return _card('论道 · 感悟兑现', '',
          `<p class="lundao-q">三问既答，所录逆道经文感悟，一次性兑现为命数铭文——</p>
           <div class="lundao-insights">${list}</div>
           <button class="opt-btn" data-action="lundao-continue">三选了断 ▸</button>`);
      }

      // —— 三选（step 5）——
      if (step === 5) {
        const keepOk = NDX.lundaoKeepOk ? NDX.lundaoKeepOk(s) : false;
        const _c = (def) => {
          const locked = def.key === 'keep' && !keepOk;
          const reason = def.key === 'keep' && !keepOk
            ? (() => {
                const hasSeal = (s.equips || []).some((e) => e && (e.id === 'jiuzhang_seal' || e.eid === 'jiuzhang_seal' || e.name === '旧账·逆道印'));
                const ligu = (s.lundaoStats && s.lundaoStats.liguUsed) || 0;
                return (!hasSeal && ligu > 0) ? '未持「旧账·逆道印」，且此世动过戾骨——两门皆闭。'
                  : (!hasSeal) ? '未持「旧账·逆道印」——账不在手，无从存留。'
                  : '此世动过戾骨献祭——了断之世，不带火气。';
              })()
            : '';
          return `<div class="lundao-choice ${def.main ? 'lundao-main' : ''} ${locked ? 'lundao-locked' : ''}">
            <div class="lundao-c-title">${def.title}${def.main ? ' <span class="lundao-main-tag">主结局</span>' : ''}</div>
            <div class="lundao-c-act">${def.act}</div>
            ${locked
              ? `<button class="opt-btn" disabled>（未达门槛）</button><p class="lundao-hint">${def.gateHint || reason}</p><p class="lundao-hint">${reason}</p>`
              : `<button class="opt-btn" data-action="lundao-choose" data-key="${def.key}">落 笔 · ${def.title.slice(0, 1)}</button>`}
          </div>`;
        };
        const bookNote = (NDX.loadJiuzhangBook && NDX.loadJiuzhangBook()) ? '<p class="lundao-hint">前世存留：《旧账》仍在怀中。</p>' : '';
        return _card('论道 · 旧账如何了断', '',
          `${bookNote}<div class="lundao-choices">${_c(L.choices.fire)}${_c(L.choices.guide)}${_c(L.choices.keep)}</div>
           <p class="lundao-hint">三选不按善恶分档——按你对这本账的了断姿态落笔。</p>`);
      }

      return this.deathScreen(s);
    },
  });
})();
