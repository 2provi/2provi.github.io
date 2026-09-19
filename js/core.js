/* ══════════════════════════════════════════════════════════════
   2Provi — core.js
   ตัวช่วยและพฤติกรรมพื้นฐานที่ทุกหน้าใช้ร่วมกัน
   (ธีม · เผยเนื้อหาตอนเลื่อน · แถบความคืบหน้า · เมนูมือถือ ·
    ตัวเลขนับขึ้น · ไฮไลต์เมนูตามหัวข้อที่อ่านอยู่)

   โหลดไฟล์นี้ก่อน page-*.js เสมอ
   ══════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  var D=document, W=window, ROOT=D.documentElement;
  function $1(s,p){ return (p||D).querySelector(s); }
  function $(s,p){ return Array.prototype.slice.call((p||D).querySelectorAll(s)); }
  function run(name,fn){ try{ fn(); }catch(err){ console.error("[2Provi] "+name+":",err); } }

  run("theme", function(){
    var btn = D.getElementById("themeBtn");
    var meta = $1('meta[name="theme-color"]');

    function get(){
      return ROOT.getAttribute("data-theme")==="dark" ? "dark" : "light";
    }
    function set(mode){
      var t = (mode==="dark") ? "dark" : "light";
      ROOT.setAttribute("data-theme", t);
      if(btn){
        btn.textContent = (t==="dark") ? "☀️" : "🌙";
        btn.setAttribute("aria-label", t==="dark" ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด");
        btn.setAttribute("title",      t==="dark" ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด");
      }
      if(meta) meta.setAttribute("content", t==="dark" ? "#040d1e" : "#0b4a8f");
      try{ localStorage.setItem("ls-theme", t); }catch(e){}
      console.log("[2Provi Group] theme =", t);
      return t;
    }
    function toggle(){ set(get()==="dark" ? "light" : "dark"); }

    /* ผูก 2 ชั้น: ปุ่มโดยตรง + delegation ที่ document (กันปุ่มถูกแทนที่) */
    if(btn) btn.addEventListener("click", function(e){ e.preventDefault(); toggle(); }, false);
    D.addEventListener("click", function(e){
      var t = e.target;
      while(t && t!==D){
        if(t.id==="themeBtn" && t!==btn){ toggle(); return; }
        t = t.parentNode;
      }
    }, false);

    /* sync ปุ่มกับสถานะเริ่มต้น (ไม่เขียน localStorage ซ้ำถ้าไม่จำเป็น) */
    set(get());

    /* ตามระบบปฏิบัติการ เฉพาะกรณีผู้ใช้ยังไม่เคยเลือกเอง */
    try{
      var mq = W.matchMedia("(prefers-color-scheme:dark)");
      var handler = function(e){
        var saved=null; try{ saved=localStorage.getItem("ls-theme"); }catch(x){}
        if(saved!=="dark" && saved!=="light") set(e.matches?"dark":"light");
      };
      if(mq.addEventListener) mq.addEventListener("change",handler);
      else if(mq.addListener) mq.addListener(handler);
    }catch(e){}

    W.LStheme = { get:get, set:set, toggle:toggle };
  });

  run("reveal", function(){
    var items=$(".rv");
    if(!items.length || !("IntersectionObserver" in W)) return;
    var reduce=false;
    try{ reduce=W.matchMedia("(prefers-reduced-motion:reduce)").matches; }catch(e){}
    if(reduce) return;

    items.forEach(function(el){ el.classList.add("pre"); });
    var io=new IntersectionObserver(function(list){
      list.forEach(function(en){
        if(!en.isIntersecting) return;
        var t=en.target, d=parseInt(t.getAttribute("data-delay")||"0",10)||0;
        W.setTimeout(function(){ t.classList.add("in"); }, d);
        io.unobserve(t);
      });
    },{threshold:0.04, rootMargin:"0px 0px -4% 0px"});
    items.forEach(function(el){ io.observe(el); });

    /* กันเหนียว: ถ้า observer ไม่ยิงภายใน 4 วิ ให้โชว์ทั้งหมด */
    W.setTimeout(function(){
      $(".rv.pre").forEach(function(el){ el.classList.add("in"); });
    },4000);
  });

  run("scroll", function(){
    var bar=$1("#prog b"), nav=D.getElementById("nav"), top=D.getElementById("toTop"), tick=false;
    function upd(){
      var y=W.pageYOffset||ROOT.scrollTop||0;
      var h=ROOT.scrollHeight-W.innerHeight;
      if(bar) bar.style.width=(h>0?(y/h)*100:0)+"%";
      if(nav) nav.classList[y>8?"add":"remove"]("stuck");
      if(top) top.classList[y>480?"add":"remove"]("on");
      tick=false;
    }
    W.addEventListener("scroll", function(){
      if(!tick){ tick=true; W.requestAnimationFrame(upd); }
    },{passive:true});
    W.addEventListener("resize", upd, {passive:true});
    upd();
    if(top) top.addEventListener("click", function(){
      try{ W.scrollTo({top:0,behavior:"smooth"}); }catch(e){ W.scrollTo(0,0); }
    },false);
  });

  run("menu", function(){
    var b=D.getElementById("burger"), m=D.getElementById("menu");
    if(!b||!m) return;
    function close(){ m.classList.remove("open"); b.classList.remove("on"); b.setAttribute("aria-expanded","false"); }
    b.addEventListener("click", function(e){
      e.stopPropagation();
      var open=m.classList.toggle("open");
      b.classList.toggle("on");
      b.setAttribute("aria-expanded", open?"true":"false");
    },false);
    $("a",m).forEach(function(a){ a.addEventListener("click",close,false); });
    D.addEventListener("click", function(e){
      if(m.classList.contains("open") && !m.contains(e.target) && !b.contains(e.target)) close();
    },false);
    W.addEventListener("keydown", function(e){ if(e.key==="Escape") close(); },false);
  });

  run("counters", function(){
    var els=$(".num"); if(!els.length) return;
    function anim(el){
      var to=parseFloat(el.getAttribute("data-to"))||0, t0=Date.now(), dur=1400;
      (function step(){
        var p=Math.min((Date.now()-t0)/dur,1);
        el.textContent=String(Math.round(to*(1-Math.pow(1-p,3))));
        if(p<1) W.requestAnimationFrame(step);
      })();
    }
    if(!("IntersectionObserver" in W)){ els.forEach(anim); return; }
    var io=new IntersectionObserver(function(l){
      l.forEach(function(en){ if(en.isIntersecting){ anim(en.target); io.unobserve(en.target); } });
    },{threshold:0.4});
    els.forEach(function(el){ io.observe(el); });
  });

  run("spy", function(){
    if(!("IntersectionObserver" in W)) return;
    var links=$("#menu a"); if(!links.length) return;
    var io=new IntersectionObserver(function(l){
      l.forEach(function(en){
        if(!en.isIntersecting) return;
        links.forEach(function(a){
          a.classList[a.getAttribute("href")==="#"+en.target.id ? "add":"remove"]("act");
        });
      });
    },{threshold:0.25});
    $("section[id]").forEach(function(s){ io.observe(s); });
  });

  /* เปิดให้ page-*.js เรียกใช้ต่อได้ */
  W.P2 = { $:$, $1:$1, run:run };
})();
