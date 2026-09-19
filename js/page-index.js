(function(){
  "use strict";
  var D=document, W=window, ROOT=D.documentElement, BUILD="index v3.0";
  var $=W.P2.$, $1=W.P2.$1, run=W.P2.run;



  /* ============================================================
     รูปภาพ: ถ้าโหลดไม่สำเร็จ ให้ซ่อนแล้วโชว์พื้นไล่สี + ไอคอนแทน
     (กันกล่องขาวว่างเวลาเน็ตช้าหรือ CDN ถูกบล็อก)
     ============================================================ */
  run("images", function(){
    $(".ph img").forEach(function(img){
      function fail(){ img.setAttribute("data-failed","1"); }
      img.addEventListener("error", fail, false);
      if(img.complete && img.naturalWidth === 0) fail();
    });
  });

  /* ============================================================
     แถบแจ้งการใช้คุกกี้ — เก็บคำตอบไว้ 180 วัน
     ============================================================ */
  run("cookie", function(){
    var KEY = "2provi_cookie_consent", DAYS = 180;
    var box = D.getElementById("ck");
    if(!box) return;

    function read(){
      var raw = null;
      try{ raw = localStorage.getItem(KEY); }catch(e){ return "blocked"; }
      if(!raw) return null;
      try{
        var c = JSON.parse(raw);
        if(!c || typeof c.expiresAt !== "number") throw new Error("bad");
        if(Date.now() > c.expiresAt){ try{ localStorage.removeItem(KEY); }catch(e){} return null; }
        return c;
      }catch(e){
        try{ localStorage.removeItem(KEY); }catch(x){}
        return null;
      }
    }
    function save(analytics, marketing){
      var d = new Date(); d.setDate(d.getDate() + DAYS);
      try{
        localStorage.setItem(KEY, JSON.stringify({
          necessary:true, analytics:analytics, marketing:marketing, expiresAt:d.getTime()
        }));
      }catch(e){}
      box.classList.remove("on");
      /* เมื่อติดตั้งเครื่องมือวิเคราะห์ในอนาคต ให้เรียกใช้ตรงนี้เมื่อ analytics === true */
    }

    /* โหมดส่วนตัวที่เขียน localStorage ไม่ได้ ก็ไม่ต้องรบกวนผู้ใช้ซ้ำทุกครั้ง */
    var saved = read();
    if(saved === null) box.classList.add("on");

    var yes = D.getElementById("ckYes"), no = D.getElementById("ckNo");
    if(yes) yes.addEventListener("click", function(){ save(true, true); }, false);
    if(no)  no.addEventListener("click",  function(){ save(false, false); }, false);
    W.addEventListener("keydown", function(e){
      if(e.key === "Escape" && box.classList.contains("on")) save(false, false);
    }, false);
  });
  console.log("[2Provi] "+BUILD+" พร้อมใช้งาน");
})();
