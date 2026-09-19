(function(){
"use strict";
var D=document,W=window,ROOT=D.documentElement,BUILD="2Provi Group";
function $1(s,p){return (p||D).querySelector(s)}
function $(s,p){return Array.prototype.slice.call((p||D).querySelectorAll(s))}
function run(n,f){try{f()}catch(e){console.error("[2Provi Group] "+n+":",e)}}
function fmt(n){n=Math.round(Number(n)||0);var g=n<0;if(g)n=-n;
  return (g?"-":"")+String(n).replace(/\B(?=(\d{3})+(?!\d))/g,",")}
function numOf(id){var e=D.getElementById(id);if(!e)return 0;
  var v=Number(String(e.value).replace(/[,\s]/g,""));return isFinite(v)&&v>=0?v:0}
function setT(id,s){var e=D.getElementById(id);if(e)e.textContent=s}

/* ── ธีม (ใช้คีย์เดียวกับหน้าหลัก จึงจำค่าข้ามหน้าได้) ── */
run("theme",function(){
  var btn=D.getElementById("themeBtn"),meta=$1('meta[name="theme-color"]');
  function get(){return ROOT.getAttribute("data-theme")==="dark"?"dark":"light"}
  function set(m){
    var t=m==="dark"?"dark":"light";
    ROOT.setAttribute("data-theme",t);
    if(btn){btn.textContent=t==="dark"?"☀️":"🌙";
      btn.setAttribute("aria-label",t==="dark"?"สลับเป็นโหมดสว่าง":"สลับเป็นโหมดมืด")}
    if(meta)meta.setAttribute("content",t==="dark"?"#04060d":"#f4f7fd");
    try{localStorage.setItem("ls-theme",t)}catch(e){}
  }
  if(btn)btn.addEventListener("click",function(){set(get()==="dark"?"light":"dark")},false);
  set(get());
});

/* ── เมนู ── */
run("menu",function(){
  var b=D.getElementById("burger"),m=D.getElementById("menu");
  if(!b||!m)return;
  function close(){m.classList.remove("open");b.classList.remove("on");b.setAttribute("aria-expanded","false")}
  b.addEventListener("click",function(e){e.stopPropagation();
    var o=m.classList.toggle("open");b.classList.toggle("on");b.setAttribute("aria-expanded",o?"true":"false")},false);
  $("a",m).forEach(function(a){a.addEventListener("click",close,false)});
  D.addEventListener("click",function(e){
    if(m.classList.contains("open")&&!m.contains(e.target)&&!b.contains(e.target))close()},false);
  W.addEventListener("keydown",function(e){if(e.key==="Escape")close()},false);
});

/* ── สกรอลล์: แถบความคืบหน้า / เงาแถบบน / ปุ่มขึ้นบน / ไฮไลต์เมนู ── */
run("scroll",function(){
  var bar=$1("#prog b"),nav=D.getElementById("nav"),top=D.getElementById("toTop"),tick=false;
  function upd(){
    var y=W.pageYOffset||ROOT.scrollTop||0,h=ROOT.scrollHeight-W.innerHeight;
    if(bar)bar.style.width=(h>0?(y/h)*100:0)+"%";
    if(nav)nav.classList[y>8?"add":"remove"]("stuck");
    if(top)top.classList[y>500?"add":"remove"]("on");
    tick=false;
  }
  W.addEventListener("scroll",function(){if(!tick){tick=true;W.requestAnimationFrame(upd)}},{passive:true});
  W.addEventListener("resize",upd,{passive:true});
  upd();
  if(top)top.addEventListener("click",function(){
    try{W.scrollTo({top:0,behavior:"smooth"})}catch(e){W.scrollTo(0,0)}},false);

  if("IntersectionObserver" in W){
    var links=$("#menu a[href^='#']");
    if(links.length){
      var io=new IntersectionObserver(function(l){
        l.forEach(function(en){
          if(!en.isIntersecting)return;
          links.forEach(function(a){a.classList[a.getAttribute("href")==="#"+en.target.id?"add":"remove"]("act")});
        });
      },{threshold:.22});
      $("section[id]").forEach(function(s){io.observe(s)});
    }
  }
});

/* ── ค่อย ๆ ปรากฏ ── */
run("reveal",function(){
  var items=$(".rv");
  if(!items.length||!("IntersectionObserver" in W))return;
  var reduce=false;try{reduce=W.matchMedia("(prefers-reduced-motion:reduce)").matches}catch(e){}
  if(reduce)return;
  items.forEach(function(e){e.classList.add("pre")});
  var io=new IntersectionObserver(function(l){
    l.forEach(function(en){
      if(!en.isIntersecting)return;
      var t=en.target,d=parseInt(t.getAttribute("data-delay")||"0",10)||0;
      W.setTimeout(function(){t.classList.add("in")},d);
      io.unobserve(t);
    });
  },{threshold:.05,rootMargin:"0px 0px -4% 0px"});
  items.forEach(function(e){io.observe(e)});
  W.setTimeout(function(){$(".rv.pre").forEach(function(e){e.classList.add("in")})},4500);
});

/* ── ตัวเลขนับขึ้น ── */
run("counters",function(){
  var els=$(".num");if(!els.length)return;
  function anim(el){
    var to=parseFloat(el.getAttribute("data-to"))||0,
        dec=parseInt(el.getAttribute("data-dec")||"0",10)||0,
        t0=Date.now(),dur=1500;
    (function step(){
      var p=Math.min((Date.now()-t0)/dur,1);
      el.textContent=(to*(1-Math.pow(1-p,3))).toFixed(dec);
      if(p<1)W.requestAnimationFrame(step);else el.textContent=to.toFixed(dec);
    })();
  }
  if(!("IntersectionObserver" in W)){els.forEach(anim);return}
  var io=new IntersectionObserver(function(l){
    l.forEach(function(en){if(en.isIntersecting){anim(en.target);io.unobserve(en.target)}})},{threshold:.4});
  els.forEach(function(e){io.observe(e)});
});

/* ── แถบสัดส่วน ── */
run("bars",function(){
  var bars=$(".bb .tk i");if(!bars.length)return;
  function fill(el){el.style.width=(parseFloat(el.getAttribute("data-w"))||0)+"%"}
  if(!("IntersectionObserver" in W)){bars.forEach(fill);return}
  var io=new IntersectionObserver(function(l){
    l.forEach(function(en){if(en.isIntersecting){fill(en.target);io.unobserve(en.target)}})},{threshold:.3});
  bars.forEach(function(e){io.observe(e)});
});

/* ══════════════════════════════════════════════════
   เครื่องคำนวณวงเงินสุขภาพ + ทุนโรคร้ายแรง
   ────────────────────────────────────────────────
   วงเงินสุขภาพ  = ค่าห้อง/คืน × ตัวคูณระดับโรงพยาบาล
     ตัวคูณสะท้อนว่าค่าห้องเป็นเพียงส่วนหนึ่งของบิล
     (ยิ่งโรงพยาบาลแพง ค่าแพทย์/ค่าผ่าตัดยิ่งสูงตามสัดส่วน)
   วงเงินอนาคต   = วงเงินวันนี้ × (1+เงินเฟ้อ)^ปี
   ทุนโรคร้ายแรง = รายได้ที่หายไป + ค่าดูแล + ส่วนที่ประกันสุขภาพไม่จ่าย − เงินเก็บ
   ══════════════════════════════════════════════════ */
run("calculator",function(){
  var form=D.getElementById("hForm");if(!form)return;

  /* ── ใส่คอมมาให้ช่องจำนวนเงินขณะพิมพ์ ──
     input[type=number] แสดงคอมมาไม่ได้ตามสเปก HTML จึงใช้ช่องข้อความแล้วจัดรูปแบบเอง
     ตำแหน่งเคอร์เซอร์คำนวณจากจำนวนหลักที่อยู่ก่อนหน้า ไม่ใช่ผลต่างความยาว */
  function bindMoney(el){
    if(!el||el.dataset.moneyBound==="1")return;
    el.dataset.moneyBound="1";
    function format(){
      var caret=el.selectionStart,before=String(el.value);
      var digitsBefore=(before.slice(0,caret).match(/[\d.]/g)||[]).length;
      var raw=before.replace(/[^\d.]/g,"");
      var dot=raw.indexOf(".");
      if(dot!==-1)raw=raw.slice(0,dot+1)+raw.slice(dot+1).replace(/\./g,"");
      if(raw===""||raw==="."){el.value=raw;return}
      var parts=raw.split("."),out=Number(parts[0]||"0").toLocaleString("en-US");
      if(parts.length>1)out+="."+parts[1];
      el.value=out;
      var seen=0,pos=out.length,i;
      for(i=0;i<out.length;i++){
        if(/[\d.]/.test(out[i]))seen++;
        if(seen>=digitsBefore){pos=i+1;break}
      }
      try{el.setSelectionRange(pos,pos)}catch(e){}
    }
    el.addEventListener("input",format,false);
    format();
  }
  $("[data-money]",form).forEach(bindMoney);

  /* ══ แถบเลื่อนคู่กับช่องกรอก ══
     เลื่อน → เติมค่าลงช่อง (ใส่คอมมาให้) แล้วคำนวณสดทันที
     พิมพ์  → เลื่อนหัวแถบตาม โดยไม่เขียนค่ากลับ ช่องจึงใส่เลขเกินสุดแถบได้ */
  function shortNum(v){
    if(v>=1000000)return (v/1000000).toFixed(v%1000000?1:0).replace(/\.0$/,"")+" ล้าน";
    return Number(v).toLocaleString("en-US");
  }
  function attachSlider(el){
    if(!el||el.dataset.sldBound==="1")return;
    var lo=parseFloat(el.dataset.min),hi=parseFloat(el.dataset.max),st=parseFloat(el.dataset.step);
    if(!isFinite(lo)||!isFinite(hi))return;
    el.dataset.sldBound="1";
    var isMoney=el.hasAttribute("data-money");
    var dec=(String(st).split(".")[1]||"").length;

    var box=D.createElement("div");box.className="sld";
    var r=D.createElement("input");
    r.type="range";r.min=lo;r.max=hi;r.step=st;
    var f=el.closest(".f"),lb=f&&f.querySelector("label");
    r.setAttribute("aria-label","แถบเลื่อนสำหรับ "+((lb&&lb.textContent||el.id).trim()));
    var bub=D.createElement("span");bub.className="sld-b";
    var t=D.createElement("div");t.className="sld-t";
    var mid=Math.round(((lo+hi)/2)/st)*st;
    t.innerHTML="<span>"+shortNum(lo)+"</span><span class='mid'>"+shortNum(mid)+"</span><span>"+
                shortNum(hi)+(isMoney?"+":"")+"</span>";
    box.appendChild(bub);box.appendChild(r);box.appendChild(t);
    el.parentNode.insertBefore(box,el.nextSibling);

    function paint(){
      var pc=hi>lo?((Number(r.value)-lo)/(hi-lo))*100:0;
      pc=Math.max(0,Math.min(100,pc));
      r.style.setProperty("--p",pc.toFixed(2)+"%");
      bub.style.left=pc.toFixed(2)+"%";
      var v=Number(r.value);
      bub.textContent=isMoney?shortNum(v):v.toFixed(dec);
    }
    function fromField(){
      var v=Number(String(el.value).replace(/[^\d.\-]/g,""));
      if(!isFinite(v))v=lo;
      r.value=Math.max(lo,Math.min(hi,v));
      paint();
    }
    r.addEventListener("input",function(){
      var v=Number(r.value);
      el.value=isMoney?v.toLocaleString("en-US"):v.toFixed(dec);
      paint();
      safe();
    },false);
    ["pointerdown","focus"].forEach(function(ev){
      r.addEventListener(ev,function(){box.classList.add("is-drag")},false);});
    ["pointerup","pointercancel","blur"].forEach(function(ev){
      r.addEventListener(ev,function(){box.classList.remove("is-drag")},false);});
    el.addEventListener("input",fromField,false);
    fromField();
  }
  $("[data-min]",form).forEach(attachSlider);

  /* ตัวคูณ: ค่าห้องยิ่งสูง บิลรวมยิ่งสูงกว่าค่าห้องหลายเท่า */
  function multiplier(room){
    if(room<=2500)return 150;
    if(room<=4500)return 170;
    if(room<=8000)return 190;
    return 210;
  }
  /* สัดส่วนค่าใช้จ่ายที่ประกันสุขภาพมักไม่ครอบคลุม (ยา/อุปกรณ์นอกบัญชี ฯลฯ) */
  var UNCOVERED=0.15;

  function calc(){
    var room=numOf("hosp")||Number(D.getElementById("hosp").value)||4500,
        yrs=Math.max(1,Math.min(40,numOf("horizon")||10)),
        income=numOf("income"),months=Math.max(0,Math.min(60,numOf("offwork"))),
        care=numOf("care"),save=numOf("save"),
        g=Math.max(0,Math.min(30,numOf("infl")))/100;

    var mult=multiplier(room);
    var now=Math.round(room*mult/100000)*100000;      // ปัดเป็นหลักแสนให้อ่านง่าย
    if(now<500000)now=500000;
    var future=now*Math.pow(1+g,yrs);

    var lostIncome=income*months;
    var careCost=care*months;
    var uncovered=now*UNCOVERED;
    var ci=lostIncome+careCost+uncovered-save;
    if(ci<0)ci=0;
    ci=Math.round(ci/50000)*50000;

    setT("oNow",fmt(now)+" บาท");
    setT("oNowSub","อิงค่าห้อง "+fmt(room)+" บาท/คืน · ประมาณ "+mult+" เท่าของค่าห้อง");
    setT("oRoom",fmt(room)+" บาท/คืน");
    setT("oYears",String(yrs));
    setT("oFuture",fmt(future)+" บาท");
    setT("oCI",fmt(ci)+" บาท");

    var f=D.getElementById("oFormula");
    if(f)f.innerHTML=
      "วงเงินสุขภาพ: ค่าห้อง "+fmt(room)+" × "+mult+" ≈ <b>"+fmt(now)+"</b><br>"+
      "ในอีก "+yrs+" ปี ที่เงินเฟ้อ "+(g*100).toFixed(1)+"% : "+fmt(now)+" × "+Math.pow(1+g,yrs).toFixed(2)+" = <b>"+fmt(future)+"</b><br>"+
      "ทุนโรคร้ายแรง: รายได้ที่หาย "+fmt(lostIncome)+" + ค่าดูแล "+fmt(careCost)+
      " + ส่วนที่ไม่ครอบคลุม "+fmt(uncovered)+" − เงินเก็บ "+fmt(save)+" = <b>"+fmt(ci)+"</b>";

    var msg;
    if(income<=0)msg="ยังไม่ได้กรอกรายได้ ทุนโรคร้ายแรงจึงคิดเฉพาะค่าดูแลและส่วนที่ประกันไม่ครอบคลุม";
    else if(months<6)msg="ระยะหยุดงานที่กรอกค่อนข้างสั้น หากเป็นโรคที่ต้องรักษาต่อเนื่อง ลองเผื่อเป็น 12–24 เดือนดู";
    else if(ci===0)msg="เงินเก็บที่มีครอบคลุมภาระช่วงพักรักษาได้แล้ว แต่ควรตรวจว่าเงินก้อนนั้นตั้งใจไว้ใช้เรื่องอื่นหรือเปล่า";
    else msg="ทุนโรคร้ายแรงราว "+fmt(ci)+" บาท จะช่วยให้หยุดพักรักษาได้จริงโดยไม่ต้องรีบกลับไปทำงาน";
    setT("oHint",msg);

    var t=new Date(),p=function(n){return n<10?"0"+n:""+n};
    setT("oStamp","คำนวณล่าสุด "+p(t.getHours())+":"+p(t.getMinutes())+":"+p(t.getSeconds())+" · "+BUILD);
    setT("lgInfl",(g*100).toFixed(1));

    drawChart(now,g,yrs);
    return {now:now,future:future,ci:ci};
  }

  /* กราฟ: ค่ารักษาโตตามเงินเฟ้อ ตัดกับวงเงินคงที่ปีไหน */
  function drawChart(budget,g,yrs){
    var svg=D.getElementById("gapChart");if(!svg)return;
    var W0=560,H0=240,L=52,R=16,T=18,B=42;
    var span=Math.max(yrs,10);
    var base=budget*0.55;                        /* ค่ารักษาตั้งต้นสมมติ = 55% ของวงเงิน */
    var maxV=Math.max(budget,base*Math.pow(1+g,span))*1.08;
    var x=function(i){return L+(W0-L-R)*(i/span)};
    var y=function(v){return T+(H0-T-B)*(1-v/maxV)};

    var pts=[],i;
    for(i=0;i<=span;i++)pts.push([x(i),y(base*Math.pow(1+g,i))]);
    var costPath="M"+pts.map(function(p){return p[0].toFixed(1)+" "+p[1].toFixed(1)}).join(" L");
    var areaPath=costPath+" L"+x(span).toFixed(1)+" "+y(0).toFixed(1)+" L"+x(0).toFixed(1)+" "+y(0).toFixed(1)+" Z";

    /* ปีที่ค่ารักษาแซงวงเงิน */
    var cross=null;
    if(g>0&&base<budget){
      var n=Math.log(budget/base)/Math.log(1+g);
      if(n<=span)cross=n;
    } else if(base>=budget) cross=0;

    var grid="",gv;
    for(gv=0;gv<=4;gv++){
      var yy=T+(H0-T-B)*(gv/4);
      grid+='<line x1="'+L+'" y1="'+yy.toFixed(1)+'" x2="'+(W0-R)+'" y2="'+yy.toFixed(1)+'" stroke="currentColor" opacity=".12"/>';
    }
    var ticks="",ti;
    for(ti=0;ti<=span;ti+=Math.max(1,Math.round(span/5))){
      ticks+='<text x="'+x(ti).toFixed(1)+'" y="'+(H0-B+22)+'" font-size="11" fill="currentColor" opacity=".6" text-anchor="middle">ปีที่ '+ti+'</text>';
    }

    var crossMark="";
    if(cross!==null&&cross>=0&&cross<=span){
      var cx=x(cross),cy=y(budget);
      crossMark=
        '<line x1="'+cx.toFixed(1)+'" y1="'+T+'" x2="'+cx.toFixed(1)+'" y2="'+(H0-B)+'" stroke="#fbbf24" stroke-dasharray="5 5" opacity=".8"/>'+
        '<circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="6" fill="#fbbf24"/>'+
        '<text x="'+Math.min(cx+10,W0-R-96).toFixed(1)+'" y="'+(T+16)+'" font-size="12" font-weight="700" fill="#fbbf24">ไม่พอตั้งแต่ปีที่ '+Math.ceil(cross)+'</text>';
    }

    svg.innerHTML=
      '<defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1">'+
      '<stop offset="0" stop-color="#fb7185" stop-opacity=".34"/><stop offset="1" stop-color="#fb7185" stop-opacity="0"/>'+
      '</linearGradient></defs>'+
      grid+
      '<path d="'+areaPath+'" fill="url(#ar)"/>'+
      '<line x1="'+L+'" y1="'+y(budget).toFixed(1)+'" x2="'+(W0-R)+'" y2="'+y(budget).toFixed(1)+
        '" stroke="#2ee6a8" stroke-width="3" stroke-linecap="round"/>'+
      '<path d="'+costPath+'" fill="none" stroke="#fb7185" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+
      crossMark+ticks+
      '<text x="'+(L-8)+'" y="'+(y(budget)+4).toFixed(1)+'" font-size="11" fill="#2ee6a8" text-anchor="end" font-weight="700">วงเงิน</text>';
  }

  function safe(e){
    if(e&&e.preventDefault)e.preventDefault();
    try{calc()}catch(err){console.error(err)}
    return false;
  }
  form.addEventListener("submit",safe,false);
  D.getElementById("hBtn").addEventListener("click",safe,false);
  $("input:not([type=range]),select",form).forEach(function(i){
    i.addEventListener("change",safe,false);
    i.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();safe()}},false);
  });
  D.getElementById("hReset").addEventListener("click",function(){
    var def={age:35,horizon:10,income:"45,000",offwork:12,care:"8,000",save:"300,000",infl:10.8},k,el;
    for(k in def){if(Object.prototype.hasOwnProperty.call(def,k)){
      el=D.getElementById(k);
      if(el){el.value=def[k];
        /* แจ้ง input เพื่อให้แถบเลื่อนและคอมมาอัปเดตตาม */
        try{el.dispatchEvent(new Event("input",{bubbles:true}))}catch(e){}
      }}}
    D.getElementById("hosp").value="4500";
    safe();
  },false);
  safe();
  W.HScalc=calc;
});

/* ══════════ ช่องใส่รูปภาพ (ระบบเดียวกับหน้าหลัก) ══════════ */
run("images",function(){
  var KEY="ls-images-health";
  var slots=$(".imgslot");if(!slots.length)return;
  var store={};try{store=JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch(e){store={}}
  var baked=(W.LS_IMAGES&&typeof W.LS_IMAGES==="object")?W.LS_IMAGES:{};

  function dataOf(id){var b=baked[id]||{},u=store[id]||{};
    return{src:(u.src!==undefined?u.src:b.src)||"",caption:(u.caption!==undefined?u.caption:b.caption)||""}}
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify(store));quota()}
    catch(e){alert("บันทึกรูปไม่สำเร็จ พื้นที่เก็บในเบราว์เซอร์เต็ม ลองใช้ลิงก์รูปแทนการอัปโหลดไฟล์ค่ะ")}
    if(D.body.classList.contains("imgedit"))refreshPanel();
  }
  function quota(){var q=D.getElementById("imgQuota");if(!q)return;
    var b=0;try{b=(localStorage.getItem(KEY)||"").length}catch(e){}
    q.textContent="พื้นที่ที่ใช้อยู่ ≈ "+(b/1024).toFixed(0)+" KB (เบราว์เซอร์มักจำกัดราว 5,000 KB)"}

  function render(fig){
    var id=fig.getAttribute("data-slot"),d=dataOf(id),img=$1("img",fig),cap=$1("figcaption",fig);
    if(d.src){
      if(!img){
        img=D.createElement("img");img.loading="lazy";img.decoding="async";
        img.addEventListener("error",function(){
          fig.classList.add("empty");
          var t=$1(".ph span",fig);if(t)t.textContent="เปิดรูปจากลิงก์นี้ไม่ได้ — ตรวจว่าเป็นลิงก์รูปโดยตรงและเปิดสาธารณะ";
        },false);
        fig.insertBefore(img,fig.firstChild);
      }
      if(img.getAttribute("src")!==d.src)img.src=d.src;
      img.alt=d.caption||"ภาพประกอบเนื้อหา";
      fig.classList.remove("empty");
    }else{ if(img)img.remove(); fig.classList.add("empty") }
    if(cap)cap.textContent=d.src?(d.caption||""):"";
    var u=$1(".u-url",fig),c=$1(".u-cap",fig);
    if(u)u.value=/^data:/.test(d.src)?"":d.src;
    if(c)c.value=d.caption;
    var fn=$1(".u-file-name",fig);
    if(fn)fn.textContent=/^data:/.test(d.src)?"ใช้ไฟล์จากเครื่อง":"";
  }

  function shrink(file,cb){
    var fr=new FileReader();
    fr.onload=function(){
      var im=new Image();
      im.onload=function(){
        var MAX=1600,w=im.width,h=im.height;
        if(w>MAX){h=Math.round(h*MAX/w);w=MAX}
        try{
          var cv=D.createElement("canvas");cv.width=w;cv.height=h;
          var cx=cv.getContext("2d");cx.fillStyle="#fff";cx.fillRect(0,0,w,h);cx.drawImage(im,0,0,w,h);
          cb(cv.toDataURL("image/jpeg",.82));
        }catch(e){cb(fr.result)}
      };
      im.onerror=function(){cb(fr.result)};
      im.src=fr.result;
    };
    fr.onerror=function(){alert("อ่านไฟล์รูปไม่สำเร็จค่ะ")};
    fr.readAsDataURL(file);
  }

  slots.forEach(function(fig){
    var id=fig.getAttribute("data-slot");if(!id)return;
    if(!$1(".ph",fig)){
      var ph=D.createElement("div");ph.className="ph";
      ph.innerHTML='<b>🖼️</b><span>ช่องใส่รูปภาพ · '+(fig.getAttribute("data-label")||id)+'</span>';
      fig.appendChild(ph);
    }
    if(!$1("figcaption",fig))fig.appendChild(D.createElement("figcaption"));
    var bar=D.createElement("div");bar.className="imgbar";
    bar.innerHTML='<span class="tag">'+(fig.getAttribute("data-label")||id)+'</span>'+
      '<input type="text" class="u-url" placeholder="วางลิงก์รูปภาพ https://…">'+
      '<button type="button" class="mini u-pick">📁 เลือกไฟล์</button>'+
      '<span class="u-file-name" style="font-size:.76rem;color:var(--tx3)"></span>'+
      '<input type="file" class="u-file" accept="image/*">'+
      '<input type="text" class="u-cap" placeholder="คำบรรยายใต้ภาพ (ไม่ใส่ก็ได้)">'+
      '<button type="button" class="mini del u-del">ลบรูป</button>';
    fig.appendChild(bar);

    var url=$1(".u-url",bar),cap=$1(".u-cap",bar),file=$1(".u-file",bar),
        pick=$1(".u-pick",bar),del=$1(".u-del",bar);
    function set(k,v){store[id]=store[id]||{};store[id][k]=v;save();render(fig)}
    url.addEventListener("change",function(){set("src",url.value.trim())},false);
    url.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();url.blur()}},false);
    cap.addEventListener("change",function(){set("caption",cap.value)},false);
    pick.addEventListener("click",function(){file.click()},false);
    file.addEventListener("change",function(){
      var f=file.files&&file.files[0];if(!f)return;
      shrink(f,function(u){set("src",u)});file.value="";
    },false);
    del.addEventListener("click",function(){store[id]={src:"",caption:""};save();render(fig)},false);
    render(fig);
  });

  var fab=D.createElement("button");
  fab.id="imgFab";fab.type="button";fab.textContent="🖼️";
  fab.setAttribute("aria-label","เปิด/ปิดโหมดจัดการรูปภาพ");
  fab.title="โหมดจัดการรูปภาพ";
  D.body.appendChild(fab);

  var panel=D.createElement("div");panel.id="imgPanel";
  panel.innerHTML='<h4>🖼️ โหมดจัดการรูปภาพ</h4>'+
    '<p>ใส่ได้ทั้ง <b>ลิงก์รูป</b> และ <b>ไฟล์จากเครื่อง</b> — รูปจะถูกจำไว้ในเบราว์เซอร์เครื่องนี้<br>'+
    'ถ้าต้องการให้ทุกคนเห็น ให้กด “คัดลอกโค้ด” แล้ววางทับบรรทัด <code>window.LS_IMAGES</code> ในไฟล์ health.html</p>'+
    '<textarea id="imgCode" readonly spellcheck="false"></textarea>'+
    '<div class="prow"><button type="button" class="mini" id="imgCopy">📋 คัดลอกโค้ด</button>'+
    '<button type="button" class="mini del" id="imgClear">ล้างรูปทั้งหมด</button>'+
    '<button type="button" class="mini" id="imgClose">ปิด</button></div><div id="imgQuota"></div>';
  D.body.appendChild(panel);

  function code(){
    var out={};
    slots.forEach(function(f){var id=f.getAttribute("data-slot"),d=dataOf(id);
      if(d.src)out[id]={src:d.src,caption:d.caption}});
    return "window.LS_IMAGES = "+JSON.stringify(out,null,2)+";";
  }
  function refreshPanel(){var ta=D.getElementById("imgCode");if(ta)ta.value=code();quota()}

  fab.addEventListener("click",function(){
    var on=D.body.classList.toggle("imgedit");
    fab.classList.toggle("on",on);panel.classList.toggle("on",on);
    fab.textContent=on?"✕":"🖼️";
    if(on)refreshPanel();
  },false);
  D.getElementById("imgClose").addEventListener("click",function(){fab.click()},false);
  D.getElementById("imgCopy").addEventListener("click",function(){
    var ta=D.getElementById("imgCode");ta.select();ta.setSelectionRange(0,ta.value.length);
    var ok=false;try{ok=D.execCommand("copy")}catch(e){}
    if(!ok&&navigator.clipboard)navigator.clipboard.writeText(ta.value).then(function(){},function(){});
    var b=this;b.textContent="✅ คัดลอกแล้ว";W.setTimeout(function(){b.textContent="📋 คัดลอกโค้ด"},1600);
  },false);
  D.getElementById("imgClear").addEventListener("click",function(){
    if(!W.confirm("ลบรูปทั้งหมดที่ใส่ไว้ในเครื่องนี้ใช่ไหม"))return;
    store={};save();slots.forEach(render);refreshPanel();
  },false);
});

console.log("[2Provi Group] โหลดสมบูรณ์ "+BUILD);
})();
