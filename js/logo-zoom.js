/* ══════════════════════════════════════════════════════════════════════
   logo-zoom.js — กดโลโก้บนแถบหัว/ฟุตเตอร์แล้วขยายดูเต็มใบ

   ทำไมต้องมี
   ─────────
   โลโก้ 2ProviGroup เป็นวงกลมที่มีตัวหนังสือ "2ProviGroup" กับที่อยู่เว็บ
   อยู่ในวงแหวนรอบนอก พอย่อลงมาเหลือ 40px บนแถบหัว วงแหวนนั้นอ่านไม่ออก
   สคริปต์นี้จึงเปิดไฟล์ต้นฉบับขนาดเต็มให้ดูเมื่อกด

   สิ่งที่จัดการให้
   ──────────────
   1) โลโก้อยู่ใน <a class="brand"> ซึ่งลิงก์กลับหน้าแรก การกดจึงต้อง
      หยุดการเปลี่ยนหน้าก่อน แล้วค่อยเปิดฉาก
   2) ไม่แตะโครงสร้าง HTML เดิมเลย — ปุ่มสำหรับคีย์บอร์ดถูกแทรกด้วย JS
      ต่อท้ายลิงก์แบรนด์ (วาง <button> ซ้อนใน <a> ไม่ได้ ผิดมาตรฐาน)
   3) ไฟล์ต้นฉบับราว 1.3MB จึงโหลดตอนกดครั้งแรกเท่านั้น ไม่ถ่วงหน้าเว็บ
   4) ปิดได้ด้วย Esc / กดพื้นหลัง / ปุ่มกากบาท และวนโฟกัสอยู่ในฉาก
      พอปิดแล้วโฟกัสกลับไปที่เดิมที่กดมา
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var FULL = "/assets/logo-2provi-full.png";
  var CAPTION = "โลโก้ 2ProviGroup";

  var box = null;      /* ฉากดำ สร้างครั้งเดียวแล้วใช้ซ้ำ */
  var img = null;
  var closeBtn = null;
  var loader = null;
  var lastFocus = null;
  var loaded = false;

  function buildBox() {
    if (box) return;

    box = document.createElement("div");
    box.className = "lbx";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", CAPTION + " ขนาดเต็ม");

    var fig = document.createElement("figure");
    fig.className = "lbx-fig";

    loader = document.createElement("div");
    loader.className = "lbx-load";
    loader.setAttribute("aria-hidden", "true");

    img = document.createElement("img");
    img.alt = CAPTION;
    img.decoding = "async";
    img.hidden = true;

    var cap = document.createElement("figcaption");
    cap.className = "lbx-cap";
    cap.textContent = CAPTION + " · กด Esc หรือแตะพื้นหลังเพื่อปิด";

    closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "lbx-close";
    closeBtn.setAttribute("aria-label", "ปิดภาพขยาย");
    closeBtn.textContent = "✕";

    fig.appendChild(loader);
    fig.appendChild(img);
    fig.appendChild(cap);
    box.appendChild(fig);
    box.appendChild(closeBtn);
    document.body.appendChild(box);

    /* กดพื้นหลัง (ไม่ใช่ตัวรูป) แล้วปิด */
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target === fig) close();
    }, false);
    closeBtn.addEventListener("click", close, false);

    img.addEventListener("load", function () {
      loaded = true;
      loader.hidden = true;
      img.hidden = false;
    }, false);

    /* โหลดรูปไม่สำเร็จ — บอกไปตรง ๆ ดีกว่าหมุนค้าง */
    img.addEventListener("error", function () {
      loader.hidden = true;
      cap.textContent = "เปิดภาพไม่สำเร็จ ลองใหม่อีกครั้งนะครับ";
    }, false);
  }

  /* วนโฟกัสให้อยู่แต่ในฉาก ไม่ให้หลุดไปหลังฉากดำ */
  function trap(e) {
    if (!box || box.hidden) return;
    if (e.key === "Escape" || e.key === "Esc") { close(); return; }
    if (e.key !== "Tab") return;
    /* ในฉากมีปุ่มเดียว จึงคาโฟกัสไว้ที่ปุ่มปิด */
    e.preventDefault();
    closeBtn.focus();
  }

  function open(trigger) {
    buildBox();
    lastFocus = trigger || document.activeElement;

    if (!loaded) {
      loader.hidden = false;
      img.hidden = true;
      /* ตั้ง src ตอนนี้เท่านั้น เพื่อไม่ให้ไฟล์ใหญ่ถ่วงตอนเปิดหน้า */
      if (!img.getAttribute("src")) img.src = FULL;
    }

    box.hidden = false;
    document.documentElement.classList.add("lbx-open");
    document.addEventListener("keydown", trap, true);
    closeBtn.focus();
  }

  function close() {
    if (!box || box.hidden) return;
    box.hidden = true;
    document.documentElement.classList.remove("lbx-open");
    document.removeEventListener("keydown", trap, true);
    if (lastFocus && typeof lastFocus.focus === "function") {
      try { lastFocus.focus(); } catch (e) {}
    }
    lastFocus = null;
  }

  function wire(mark) {
    if (mark.classList.contains("is-zoomable")) return;
    if (!mark.querySelector("img")) return;   /* หน้าไหนยังเป็นตัวอักษรอยู่ ข้ามไป */

    mark.classList.add("is-zoomable");
    mark.setAttribute("title", "กดเพื่อดูโลโก้ขนาดเต็ม");

    mark.addEventListener("click", function (e) {
      /* โลโก้อยู่ในลิงก์กลับหน้าแรก ต้องกันไม่ให้เปลี่ยนหน้า */
      e.preventDefault();
      e.stopPropagation();
      open(mark);
    }, false);

    /* ปุ่มสำหรับคีย์บอร์ด วางนอกลิงก์เสมอ (ซ้อน <button> ใน <a> ผิดมาตรฐาน)
       ใส่ตัวเดียวต่อหน้า ตรงโลโก้ตัวแรกที่เจอ — ปกติคือตัวบนแถบหัว แต่หน้า
       ขอบคุณไม่มีแถบหัว โลโก้อยู่กลางการ์ด จึงไม่ผูกกับ header */
    if (document.querySelector(".logo-zoom-key")) return;
    var host = mark.closest("a") || mark;
    if (!host.parentNode) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "logo-zoom-key";
    btn.textContent = "ดูโลโก้ขนาดเต็ม";
    btn.addEventListener("click", function () { open(btn); }, false);
    host.parentNode.insertBefore(btn, host.nextSibling);
  }

  function boot() {
    /* .mark / .brand-mark = ตราบนแถบหัวและฟุตเตอร์
       .hero-logo         = โลโก้ในช่องว่างฝั่งขวาของ hero */
    var marks = document.querySelectorAll(".mark, .brand-mark, .hero-logo");
    for (var i = 0; i < marks.length; i++) wire(marks[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, false);
  } else {
    boot();
  }
})();
