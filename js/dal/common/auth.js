    // ════════════════════════════════════════════════════════════════
    //  DAL — js/dal/common/auth.js
    //  Password hashing — gates data access, so treated as DAL per
    //  spend-na-restructure.md. Extracted verbatim from js/app.js
    //  (batch 1). Plain classic script, same global scope as app.js —
    //  NOT an ES module. Loaded before app.js in index.html. No logic
    //  changes, no renamed functions.
    // ════════════════════════════════════════════════════════════════

    // ── MD5 ────────────────────────────────────────────────────────
    function md5(s) {
      function sa(x, y) { const l = (x & 0xFFFF) + (y & 0xFFFF), m = (x >> 16) + (y >> 16) + (l >> 16); return (m << 16) | (l & 0xFFFF) }
      function rl(n, c) { return (n << c) | (n >>> (32 - c)) }
      function cm(q, a, b, x, s, t) { return sa(rl(sa(sa(a, q), sa(x, t)), s), b) }
      const ff = (a, b, c, d, x, s, t) => cm((b & c) | ((~b) & d), a, b, x, s, t);
      const gg = (a, b, c, d, x, s, t) => cm((b & d) | (c & (~d)), a, b, x, s, t);
      const hh = (a, b, c, d, x, s, t) => cm(b ^ c ^ d, a, b, x, s, t);
      const ii = (a, b, c, d, x, s, t) => cm(c ^ (b | (~d)), a, b, x, s, t);
      const str = unescape(encodeURIComponent(s));
      const by = []; for (let i = 0; i < str.length; i++)by.push(str.charCodeAt(i));
      by.push(0x80); while (by.length % 64 !== 56) by.push(0);
      const lo = str.length * 8; by.push(lo & 0xFF, (lo >> 8) & 0xFF, (lo >> 16) & 0xFF, (lo >> 24) & 0xFF, 0, 0, 0, 0);
      let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
      for (let i = 0; i < by.length; i += 64) {
        const M = []; for (let j = 0; j < 16; j++)M[j] = by[i + j * 4] | (by[i + j * 4 + 1] << 8) | (by[i + j * 4 + 2] << 16) | (by[i + j * 4 + 3] << 24);
        const [A, B, C, D] = [a, b, c, d];
        a = ff(a, b, c, d, M[0], 7, -680876936); d = ff(d, a, b, c, M[1], 12, -389564586); c = ff(c, d, a, b, M[2], 17, 606105819); b = ff(b, c, d, a, M[3], 22, -1044525330);
        a = ff(a, b, c, d, M[4], 7, -176418897); d = ff(d, a, b, c, M[5], 12, 1200080426); c = ff(c, d, a, b, M[6], 17, -1473231341); b = ff(b, c, d, a, M[7], 22, -45705983);
        a = ff(a, b, c, d, M[8], 7, 1770035416); d = ff(d, a, b, c, M[9], 12, -1958414417); c = ff(c, d, a, b, M[10], 17, -42063); b = ff(b, c, d, a, M[11], 22, -1990404162);
        a = ff(a, b, c, d, M[12], 7, 1804603682); d = ff(d, a, b, c, M[13], 12, -40341101); c = ff(c, d, a, b, M[14], 17, -1502002290); b = ff(b, c, d, a, M[15], 22, 1236535329);
        a = gg(a, b, c, d, M[1], 5, -165796510); d = gg(d, a, b, c, M[6], 9, -1069501632); c = gg(c, d, a, b, M[11], 14, 643717713); b = gg(b, c, d, a, M[0], 20, -373897302);
        a = gg(a, b, c, d, M[5], 5, -701558691); d = gg(d, a, b, c, M[10], 9, 38016083); c = gg(c, d, a, b, M[15], 14, -660478335); b = gg(b, c, d, a, M[4], 20, -405537848);
        a = gg(a, b, c, d, M[9], 5, 568446438); d = gg(d, a, b, c, M[14], 9, -1019803690); c = gg(c, d, a, b, M[3], 14, -187363961); b = gg(b, c, d, a, M[8], 20, 1163531501);
        a = gg(a, b, c, d, M[13], 5, -1444681467); d = gg(d, a, b, c, M[2], 9, -51403784); c = gg(c, d, a, b, M[7], 14, 1735328473); b = gg(b, c, d, a, M[12], 20, -1926607734);
        a = hh(a, b, c, d, M[5], 4, -378558); d = hh(d, a, b, c, M[8], 11, -2022574463); c = hh(c, d, a, b, M[11], 16, 1839030562); b = hh(b, c, d, a, M[14], 23, -35309556);
        a = hh(a, b, c, d, M[1], 4, -1530992060); d = hh(d, a, b, c, M[4], 11, 1272893353); c = hh(c, d, a, b, M[7], 16, -155497632); b = hh(b, c, d, a, M[10], 23, -1094730640);
        a = hh(a, b, c, d, M[13], 4, 681279174); d = hh(d, a, b, c, M[0], 11, -358537222); c = hh(c, d, a, b, M[3], 16, -722521979); b = hh(b, c, d, a, M[6], 23, 76029189);
        a = hh(a, b, c, d, M[9], 4, -640364487); d = hh(d, a, b, c, M[12], 11, -421815835); c = hh(c, d, a, b, M[15], 16, 530742520); b = hh(b, c, d, a, M[2], 23, -995338651);
        a = ii(a, b, c, d, M[0], 6, -198630844); d = ii(d, a, b, c, M[7], 10, 1126891415); c = ii(c, d, a, b, M[14], 15, -1416354905); b = ii(b, c, d, a, M[5], 21, -57434055);
        a = ii(a, b, c, d, M[12], 6, 1700485571); d = ii(d, a, b, c, M[3], 10, -1894986606); c = ii(c, d, a, b, M[10], 15, -1051523); b = ii(b, c, d, a, M[1], 21, -2054922799);
        a = ii(a, b, c, d, M[8], 6, 1873313359); d = ii(d, a, b, c, M[15], 10, -30611744); c = ii(c, d, a, b, M[6], 15, -1560198380); b = ii(b, c, d, a, M[13], 21, 1309151649);
        a = ii(a, b, c, d, M[4], 6, -145523070); d = ii(d, a, b, c, M[11], 10, -1120210379); c = ii(c, d, a, b, M[2], 15, 718787259); b = ii(b, c, d, a, M[9], 21, -343485551);
        a = sa(a, A); b = sa(b, B); c = sa(c, C); d = sa(d, D);
      }
      const h = n => [n & 0xFF, (n >> 8) & 0xFF, (n >> 16) & 0xFF, (n >> 24) & 0xFF].map(x => (x < 16 ? '0' : '') + x.toString(16)).join('');
      return [a, b, c, d].map(h).join('');
    }

    function hashPw(raw) { return md5((raw || '').trim()); } // CR-02: single canonical password hasher — never call md5() directly
