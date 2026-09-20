/* ══════════════════════════════════════════════════════════════
   2Provi — nav.js
   ยุบแถบลิงก์ข้ามหน้า (.tools) เข้าเมนูแฮมเบอร์เกอร์บนจอแคบ

   เหตุผล: แถบ .tools เลื่อนได้แนวนอนอย่างเดียว บนมือถือจึงเห็นลิงก์
   โดนตัดขอบขวาและดูเหมือนเมนู "ไม่ยุบตามจอ" — สคริปต์นี้โคลนลิงก์
   ชุดเดียวกันไปต่อท้ายเมนู ส่วน CSS (mobile.css) เป็นคนตัดสินว่าจะ
   โชว์ชุดไหนที่ความกว้างเท่าไร ทำงานได้ทั้งหน้าที่ใช้ core.js และ
   หน้าที่มีสคริปต์ของตัวเอง โหลดเป็นไฟล์สุดท้ายเสมอ
   ══════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  var D = document;

  function boot(){
    var menu  = D.getElementById("menu");
    var strip = D.querySelector(".tools-in");
    var burger= D.getElementById("burger");
    if(!menu || !strip || menu.querySelector(".xp")) return;

    var box = D.createElement("div");
    box.className = "xp";

    var lbl = D.createElement("span");
    lbl.className = "xp-l";
    lbl.textContent = "ไปหน้าอื่น";
    box.appendChild(lbl);

    Array.prototype.forEach.call(strip.querySelectorAll("a"), function(a){
      var c = a.cloneNode(true);
      /* ทิ้งคลาสของแถบเดิมทั้งหมด เพราะสีและเงาถูกออกแบบมาสำหรับแถบแนวนอน
         เหลือไว้แค่ .askq ที่เป็นปุ่มกระทำหลัก กับสถานะหน้าปัจจุบัน */
      c.removeAttribute("class");
      if(a.classList.contains("askq")) c.className = "askq";
      if(a.getAttribute("aria-current") === "page") c.setAttribute("aria-current","page");
      box.appendChild(c);
    });

    /* ปุ่มหลักบนแถบหัว (.nosm) ถูกซ่อนบนจอแคบ ถ้าไม่ย้ายมาไว้ในเมนูด้วย
       ผู้ใช้มือถือจะไปหน้าสมัครตัวแทนจากแถบหัวไม่ได้เลย */
    var act = D.querySelector(".acts a.btn");
    if(act){
      var ac = act.cloneNode(true);
      ac.removeAttribute("class");
      ac.className = "xp-alt";
      box.appendChild(ac);
    }

    menu.appendChild(box);

    /* core.js ผูก handler ปิดเมนูไปตั้งแต่ก่อนลิงก์ชุดนี้จะถูกสร้าง
       จึงต้องผูกให้ลิงก์ที่โคลนมาเองอีกรอบ ไม่งั้นกดแล้วเมนูค้างเปิด */
    if(burger){
      Array.prototype.forEach.call(box.querySelectorAll("a"), function(a){
        a.addEventListener("click", function(){
          menu.classList.remove("open");
          burger.classList.remove("on");
          burger.setAttribute("aria-expanded","false");
        }, false);
      });
    }
  }

  if(D.readyState === "loading") D.addEventListener("DOMContentLoaded", boot, false);
  else boot();
})();
