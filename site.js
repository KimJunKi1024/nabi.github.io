(function pubSiteMain() {
    var ed = document.getElementById('editor');
    function from64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
    function toc() {
      var hs = Array.prototype.filter.call(ed.querySelectorAll('h1, h2, h3, details.th1 > summary, details.th2 > summary, details.th3 > summary'), function (h) { return !h.closest('.toc') && h.textContent.trim(); });
      ed.querySelectorAll('.toc').forEach(function (t) {
        t.innerHTML = '<div class="toc-t">목차</div>';
        hs.forEach(function (h) {
          var lv = h.nodeName === 'SUMMARY' ? ((/\bth([123])\b/.exec(h.parentNode.className) || [])[1] || '3') : h.nodeName.charAt(1);
          var a = document.createElement('div'); a.className = 'toc-i lv' + lv; a.textContent = h.textContent.replace(/​/g, '').trim();
          a.onclick = function () { for (var d = h.parentNode.closest('details'); d; d = d.parentNode.closest('details')) d.open = true; h.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
          t.appendChild(a);
        });
      });
    }
    function ready() {
      toc();
      ed.addEventListener('click', function (e) {
        var t = e.target.closest ? e.target.closest('[data-href], .bm[data-url], .att[data-b64]') : null; if (!t) return;
        if (t.hasAttribute('data-b64')) {
          var u = URL.createObjectURL(new Blob([from64(t.getAttribute('data-b64'))], { type: t.getAttribute('data-mime') || 'application/octet-stream' }));
          var a = document.createElement('a'); a.href = u; a.download = t.getAttribute('data-name') || '파일'; document.body.appendChild(a); a.click(); a.remove(); return;
        }
        if (t.hasAttribute('data-url')) { window.open(t.getAttribute('data-url'), '_blank', 'noopener'); return; }
        if (t.classList.contains('att')) window.open(t.getAttribute('data-href'), '_blank', 'noopener'); else location.href = t.getAttribute('data-href');
      });
    }
    var encEl = document.getElementById('pub-enc');
    if (!encEl) { ready(); return; }
    var box = JSON.parse(encEl.textContent), form = document.getElementById('pub-lock'), inp = document.getElementById('pub-pw'), err = document.getElementById('pub-err');
    function open(pw) {
      var enc = new TextEncoder(), s = crypto.subtle;
      return s.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']).then(function (base) {
        return s.deriveBits({ name: 'PBKDF2', salt: from64(box.s), iterations: box.it, hash: 'SHA-256' }, base, 512);
      }).then(function (bits) { return s.importKey('raw', new Uint8Array(bits).slice(0, 32), 'AES-GCM', false, ['decrypt']); })
        .then(function (key) { return s.decrypt({ name: 'AES-GCM', iv: from64(box.i) }, key, from64(box.c)); })
        .then(function (plain) {
          ed.innerHTML = new TextDecoder().decode(plain); form.hidden = true;
          try { sessionStorage.setItem('nabi-pw', pw); } catch (e) {}
          ready();
        });
    }
    form.onsubmit = function (e) {
      e.preventDefault(); err.textContent = '여는 중…';
      open(inp.value).catch(function () { err.textContent = '비밀번호가 맞지 않아요.'; inp.select(); });
    };
    var saved = ''; try { saved = sessionStorage.getItem('nabi-pw') || ''; } catch (e) {}
    if (saved) open(saved).catch(function () { form.hidden = false; inp.focus(); }); else { form.hidden = false; inp.focus(); }
  })();
