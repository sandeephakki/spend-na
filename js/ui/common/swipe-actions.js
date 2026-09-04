    // ════════════════════════════════════════════════════════════════
    //  UI — js/ui/common/swipe-actions.js
    //  Extracted from js/app.js (batch 8 — see spend-na-restructure.md).
    //  Plain classic script, same global scope as app.js. Loaded before
    //  app.js. MECHANICAL CHANGE (not a logic change): was an anonymous
    //  IIFE `(function initSwipeActions(container) {...})(listEl)`
    //  inlined at its one call site inside r_history(); converted to a
    //  named top-level function so it can be extracted, with the call
    //  site in app.js changed to `initSwipeActions(listEl)`. Runtime
    //  behavior is identical — same body, same single call, same
    //  argument — only the declaration form changed.
    // ════════════════════════════════════════════════════════════════

    function initSwipeActions(container) {
      let startX=0,startY=0,activeWrap=null; // LW-02: let not var
      function onSwipeStart(e){startX=e.touches[0].clientX;startY=e.touches[0].clientY;activeWrap=e.target.closest('.htxn-wrap');}
      function onSwipeEnd(e){
        if(!activeWrap)return;
        const dx=e.changedTouches[0].clientX-startX,dy=Math.abs(e.changedTouches[0].clientY-startY);
        if(dy>30)return;
        if(dx<-50){container.querySelectorAll('.htxn-wrap.swiped').forEach(function(w){if(w!==activeWrap)w.classList.remove('swiped');});activeWrap.classList.add('swiped');}
        else if(dx>20){activeWrap.classList.remove('swiped');}
      }
      function onSwipeClear(e){if(!e.target.closest('.htxn-wrap.swiped'))container.querySelectorAll('.htxn-wrap.swiped').forEach(function(w){w.classList.remove('swiped');});}
      container.addEventListener('touchstart',onSwipeStart,{passive:true});
      container.addEventListener('touchend',onSwipeEnd,{passive:true});
      container.addEventListener('touchstart',onSwipeClear,{passive:true});
      container._swipeCleanup = function(){
        container.removeEventListener('touchstart',onSwipeStart);
        container.removeEventListener('touchend',onSwipeEnd);
        container.removeEventListener('touchstart',onSwipeClear);
      };
    }
