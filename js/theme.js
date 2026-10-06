/* ══════════════════════════════════════════════════════════════
   2Provi — theme.js
   ปุ่มสลับธีมแบบสแตนด์อโลน สำหรับหน้าที่ไม่ได้โหลด core.js / page-*.js
   (quote / join / thank-you) ใช้คีย์ localStorage เดียวกับทั้งเว็บ = "ls-theme"
   เพื่อให้ธีมต่อเนื่องกันทุกหน้า
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var D = document, W = window, ROOT = D.documentElement;
  var btn = D.getElementById("themeBtn");
  var meta = D.querySelector('meta[name="theme-color"]');

  function get() { return ROOT.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  function set(mode) {
    var t = (mode === "dark") ? "dark" : "light";
    ROOT.setAttribute("data-theme", t);
    if (btn) {
      btn.textContent = (t === "dark") ? "☀️" : "🌙";
      btn.setAttribute("aria-label", t === "dark" ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด");
      btn.setAttribute("title", t === "dark" ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด");
    }
    if (meta) meta.setAttribute("content", t === "dark" ? "#040d1e" : "#0b4a8f");
    try { localStorage.setItem("ls-theme", t); } catch (e) {}
    return t;
  }
  function toggle() { set(get() === "dark" ? "light" : "dark"); }

  if (btn) btn.addEventListener("click", function (e) { e.preventDefault(); toggle(); }, false);
  D.addEventListener("click", function (e) {
    var t = e.target;
    while (t && t !== D) { if (t.id === "themeBtn" && t !== btn) { toggle(); return; } t = t.parentNode; }
  }, false);

  set(get());

  /* ตามระบบปฏิบัติการ เฉพาะกรณีผู้ใช้ยังไม่เคยเลือกเอง */
  try {
    var mq = W.matchMedia("(prefers-color-scheme:dark)");
    var handler = function (e) {
      var saved = null; try { saved = localStorage.getItem("ls-theme"); } catch (x) {}
      if (saved !== "dark" && saved !== "light") set(e.matches ? "dark" : "light");
    };
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else if (mq.addListener) mq.addListener(handler);
  } catch (e) {}
})();
