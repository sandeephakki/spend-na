    // ════════════════════════════════════════════════════════════════
    //  CORE — js/core/app-init.js
    //  Boot sequence — wires everything together and starts the app.
    //  Extracted verbatim from the tail of js/app.js (batch 9 — see
    //  spend-na-restructure.md). Plain classic script, same global
    //  scope as app.js. UNLIKE every other extracted file so far,
    //  this one loads AFTER app.js — it calls APP.boot() and
    //  references APP/S directly at top-level (script-load) time, not
    //  deferred inside a function, so APP must already exist. No
    //  logic changes, no renamed functions.
    // ════════════════════════════════════════════════════════════════

    // BUG-017: global error handlers
    // BUG-6: Pinch zoom snap-back on iOS
    (function(){
      var _lte=0,_pin=false;
      document.addEventListener('touchstart',function(e){
        if(e.touches.length>=2)_pin=true;
      },{passive:true});
      document.addEventListener('touchend',function(e){
        var now=Date.now();
        if(e.touches.length===0&&now-_lte<=300&&!_pin)e.preventDefault();
        if(e.touches.length===0)_lte=now;
        if(_pin&&e.touches.length===0){
          _pin=false;
          setTimeout(function(){
            var m=document.querySelector('meta[name=viewport]');
            if(!m)return;
            var o=m.getAttribute('content');
            m.setAttribute('content',o+',maximum-scale=1.0,minimum-scale=1.0');
            requestAnimationFrame(function(){
              requestAnimationFrame(function(){m.setAttribute('content',o);});
            });
          },120);
        }
      },{passive:false});
    })();
    window.onerror = (msg, src, line) => { console.error('Global error:', msg, src, line); };
    window.addEventListener('unhandledrejection', e => {
      console.error('Unhandled promise:', e.reason);
      if (e.reason && String(e.reason).toLowerCase().indexOf('storage') === -1) {
        toast('Something went wrong. Please try again.');
      }
      e.preventDefault();
    });

        // BUG-020: Escape key closes modal
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.getElementById('modal').classList.contains('on')) APP.cm();
    });

        APP.boot();

    // BUG-021: Swipe right to go back on sub-screens
    (function () {
      let sx = 0, sy = 0;
      const BACK_SCREENS = { sort: 'home', slice: 'month', add: 'home', limits: 'home', settings: 'home', normalize: 'settings' };
      document.addEventListener('touchstart', e => { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, { passive: true });
      document.addEventListener('touchend', e => {
        if (!e.changedTouches.length) return;
        const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        if (sx > 30) return; // must start from left edge
        if (dx > 60 && Math.abs(dy) < 80) {
          const dest = BACK_SCREENS[S.tab];
          if (dest) APP.go(dest);
        }
      }, { passive: true });
    })();
