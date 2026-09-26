/* ══════════════════════════════════════════════════════════════════════
   siderail.js — แถบหัวข้อในหน้าที่พับเก็บได้

   ปุ่มสามขีด (#burger) กับเมนู (#menu) ถูกผูกไว้แล้วใน core.js และใน
   page-*.js ของแต่ละหน้า สคริปต์นี้จึงไม่แย่งงานนั้น แต่คอยมองว่า #menu
   ถูกเปิด/ปิดเมื่อไร แล้วสะท้อนสถานะไปที่ตัวแถบข้าง ฉากบัง และ <html>

   ทำแบบนี้เพราะโค้ดเดิมกระจายอยู่ใน 5 ไฟล์ ถ้าไปแก้ทุกไฟล์มีโอกาสพลาด
   มากกว่า และถ้าวันหนึ่งสคริปต์เดิมถูกเปลี่ยน ตัวนี้ก็ยังตามได้เอง

   เพิ่มให้อีกสามอย่างที่ของเดิมไม่มี
     1) ฉากบังหลังแถบ กดแล้วปิด
     2) ล็อกการเลื่อนหน้าหลักขณะเปิดบนจอแคบ
     3) คืนโฟกัสกลับไปที่ปุ่มสามขีดเมื่อปิด และวนโฟกัสอยู่ในแถบขณะเปิด
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var D = document;

  function boot() {
    var rail = D.getElementById("siderail");
    var menu = D.getElementById("menu");
    var burger = D.getElementById("burger");
    var veil = D.getElementById("railVeil");
    if (!rail || !menu || !burger) return;

    var ROOT = D.documentElement;
    var lastOpen = false;

    function isOpen() { return menu.classList.contains("open"); }

    function paint() {
      var open = isOpen();
      if (open === lastOpen) return;
      lastOpen = open;

      rail.classList.toggle("open", open);
      rail.setAttribute("aria-hidden", open ? "false" : "true");
      ROOT.classList.toggle("rail-open", open);
      burger.setAttribute("aria-label", open ? "ปิดเมนูหัวข้อ" : "เปิดเมนูหัวข้อ");

      if (veil) {
        if (open) {
          veil.hidden = false;
          /* บังคับให้เบราว์เซอร์คำนวณเลย์เอาต์ก่อน ไม่งั้นอนิเมชันไม่ทำงาน */
          void veil.offsetWidth;
          veil.classList.add("on");
        } else {
          veil.classList.remove("on");
          /* รอให้จางหายก่อนค่อยซ่อน จะได้ไม่หายวูบ */
          setTimeout(function () { if (!isOpen()) veil.hidden = true; }, 320);
        }
      }

      if (open) {
        var first = rail.querySelector("a");
        if (first) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
      } else {
        try { burger.focus({ preventScroll: true }); } catch (e) {}
      }
    }

    /* core.js / page-*.js เป็นคนเติมและถอดคลาส .open ที่ #menu
       จึงเฝ้าดูแอตทริบิวต์ class แทนการผูกปุ่มซ้ำ */
    if (window.MutationObserver) {
      new MutationObserver(paint).observe(menu, { attributes: true, attributeFilter: ["class"] });
    } else {
      /* เบราว์เซอร์เก่ามาก ถอยไปเช็กเป็นรอบ ๆ */
      setInterval(paint, 200);
    }

    /* กดฉากบังแล้วปิด — สั่งผ่านปุ่มเดิมเพื่อให้สถานะทุกที่ตรงกัน */
    if (veil) {
      veil.addEventListener("click", function () {
        if (isOpen()) burger.click();
      }, false);
    }

    /* Esc ปิด (core.js ทำให้อยู่แล้วในบางหน้า แต่ไม่ใช่ทุกหน้า) */
    D.addEventListener("keydown", function (e) {
      if ((e.key === "Escape" || e.key === "Esc") && isOpen()) burger.click();
    }, false);

    /* วนโฟกัสให้อยู่ในแถบขณะเปิดบนจอแคบ ที่กว้างกว่านั้นปล่อยให้ tab ออกได้
       เพราะแถบไม่ได้บังเนื้อหาทั้งหน้า */
    D.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !isOpen()) return;
      if (window.innerWidth > 980) return;
      var f = rail.querySelectorAll("a[href],button:not([disabled])");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && D.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && D.activeElement === last) { e.preventDefault(); burger.focus(); }
    }, false);

    paint();
  }

  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", boot, false);
  else boot();
})();
