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
