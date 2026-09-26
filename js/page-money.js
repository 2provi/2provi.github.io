(function(){
  "use strict";
  var D=document, W=window, ROOT=D.documentElement, BUILD="v5.4";

  /* [แก้บั๊ก] เดิมประกาศ $ ซ้ำสองครั้ง ตัวหลังทับตัวแรก ทำให้ทุกที่ที่
     ตั้งใจจะได้ "อีลิเมนต์เดียว" กลับได้ "อาเรย์" แล้วโยน TypeError เงียบ ๆ
     ผลคือ ธีมไม่ถูกจำ / แถบความคืบหน้า / ปุ่มขึ้นบน / เช็กลิสต์ ไม่ทำงาน
     จึงแยกเป็น $1 (ตัวเดียว) กับ $ (หลายตัว) */
  function $1(s,p){ return (p||D).querySelector(s); }
  function $(s,p){ return Array.prototype.slice.call((p||D).querySelectorAll(s)); }
  function run(name,fn){ try{ fn(); }catch(err){ console.error("[2Provi Group] "+name+":",err); } }

  /* ============================================================
     1. THEME — single source of truth = data-theme บน <html>
        ไม่แตะ className เด็ดขาด จึงไม่มีทาง desync
     ============================================================ */
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

  /* ============================================================
     2. CALCULATOR
     ============================================================ */
  run("calculator", function(){
    var form   = D.getElementById("calcForm");
    var errbox = D.getElementById("errbox");
    if(!form){ console.error("[2Provi Group] ไม่พบ #calcForm"); return; }

    function showErr(m){ if(errbox){ errbox.textContent="⛔ "+m; errbox.className="on"; } else alert(m); }
    function clearErr(){ if(errbox){ errbox.textContent=""; errbox.className=""; } }

    function num(id){
      var el = D.getElementById(id);
      if(!el) throw new Error("ไม่พบช่องกรอก #"+id);
      var raw = String(el.value).replace(/[,\s]/g,"").trim();
      if(raw==="") return 0;
      var v = Number(raw);
      if(!isFinite(v) || v<0) return 0;
      return v;
    }
    function fmt(n){
      n = Math.round(Number(n)||0);
      var neg = n<0; if(neg) n = -n;
      return (neg?"-":"") + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    function setText(id,s){ var e=D.getElementById(id); if(e) e.textContent=s; }
    function setW(id,p){ var e=D.getElementById(id); if(e) e.style.width=Math.max(0,Math.min(100,p)).toFixed(1)+"%"; }
    function pad(n){ return n<10?"0"+n:""+n; }

    /* มูลค่าปัจจุบันของกระแสรายได้ที่โตตามเงินเฟ้อ (growing annuity)
       C = ค่าใช้จ่ายปีแรก, g = เงินเฟ้อ, r = ผลตอบแทนของเงินก้อน, n = จำนวนปี
       PV = C × [1 − ((1+g)/(1+r))^n] / (r − g)   เมื่อ r ≠ g
       ถ้า r ≈ g ผลตอบแทนโตทันเงินเฟ้อพอดี → PV = C × n  */
    function pvGrowing(C, g, r, n){
      if(n<=0 || C<=0) return 0;
      if(Math.abs(r-g) < 1e-9) return C*n;
      return C * (1 - Math.pow((1+g)/(1+r), n)) / (r-g);
    }


    /* ── ใส่คอมมาให้ช่องจำนวนเงินขณะพิมพ์ ──
       input[type=number] แสดงคอมมาไม่ได้ตามสเปก HTML จึงต้องใช้ช่องข้อความ
       แล้วจัดรูปแบบเอง โดยคำนวณตำแหน่งเคอร์เซอร์จาก "จำนวนหลักที่อยู่ก่อนหน้า"
       ไม่ใช่ผลต่างความยาว ไม่งั้นเคอร์เซอร์จะกระโดดไปท้ายช่องเวลาแก้กลางตัวเลข */
    function bindMoney(el){
      if(!el || el.dataset.moneyBound==="1") return;
      el.dataset.moneyBound="1";
      function format(){
        var caret=el.selectionStart, before=String(el.value);
        var digitsBefore=(before.slice(0,caret).match(/[\d.]/g)||[]).length;
        var raw=before.replace(/[^\d.]/g,"");
        var dot=raw.indexOf(".");
        if(dot!==-1) raw=raw.slice(0,dot+1)+raw.slice(dot+1).replace(/\./g,"");
        if(raw==="" || raw==="."){ el.value=raw; return; }
        var parts=raw.split(".");
        var out=Number(parts[0]||"0").toLocaleString("en-US");
        if(parts.length>1) out+="."+parts[1];
        el.value=out;
        var seen=0,pos=out.length,i;
        for(i=0;i<out.length;i++){
          if(/[\d.]/.test(out[i])) seen++;
          if(seen>=digitsBefore){ pos=i+1; break; }
        }
        try{ el.setSelectionRange(pos,pos); }catch(e){}
      }
      el.addEventListener("input",format,false);
      format();
    }
    $("[data-money]",form).forEach(bindMoney);


    /* ══ แถบเลื่อนคู่กับช่องกรอก ══
       เลื่อน → เติมค่าลงช่อง (ใส่คอมมาให้) แล้วคำนวณสดทันที
       พิมพ์  → เลื่อนหัวแถบตาม โดยไม่เขียนค่ากลับ ช่องจึงใส่เลขเกินสุดแถบได้ */
    /* ══ แถบเลื่อน ══
       ช่องเงินบางช่องมีช่วงกว้างมาก (เช่น 0–100,000,000,000)
       ถ้าใช้สเกลเชิงเส้น เลื่อน 1 พิกเซลจะกระโดดทีละร้อยล้าน เลือกหลักแสนไม่ได้เลย
       จึงใช้สเกลลอการิทึม: ครึ่งแรกของแถบครอบคลุมหลักพันถึงหลักล้าน
       ครึ่งหลังค่อยไต่ขึ้นหลักร้อยล้านถึงแสนล้าน ทำให้ทั้งคนรายได้ปกติ
       และคนสินทรัพย์สูงเลือกได้ในแถบเดียวกัน */
    var SLD_FLOOR = 1000;          /* ค่าต่ำสุดที่สเกล log เริ่มไต่ (ต่ำกว่านี้คือ 0) */
    var SLD_POS   = 1000;          /* ความละเอียดของตำแหน่งหัวแถบ */

    function shortNum(v){
      if(v>=1e9)  return (v/1e9 ).toFixed(v%1e9 ?1:0).replace(/\.0$/,"")+" พันล้าน";
      if(v>=1e6)  return (v/1e6 ).toFixed(v%1e6 ?1:0).replace(/\.0$/,"")+" ล้าน";
      return Number(v).toLocaleString("en-US");
    }
    /* ปัดให้เป็นเลขกลม ๆ — ขนาดขั้นต้องไม่หยาบกว่าระยะที่หัวแถบขยับได้จริง
       ไม่งั้นจะเจออาการ "เลื่อนแล้วตัวเลขไม่ขยับ" ในบางช่วง
       gran = ระยะที่ค่าขยับเมื่อเลื่อนหัวแถบ 1 ขีด ณ ค่านั้น */
    function sldSnap(v, gran){
      if(!(v>0)) return 0;
      var s;
      if(gran>0){
        var e=Math.pow(10,Math.floor(Math.log(gran)/Math.LN10)), m=gran/e;
        s = m>=5 ? 5*e : (m>=2 ? 2*e : e);          /* เลขกลมชุด 1-2-5 ที่ ≤ gran */
        s = Math.max(10, s);
      }else{
        s = v<1e4?500 : v<1e5?1e3 : v<1e6?1e4 : v<1e7?1e5
          : v<1e8?1e6 : v<1e9?1e7 : v<1e10?1e8 : 1e9;
      }
      return Math.round(v/s)*s;
    }

    function attachSlider(el){
      if(!el||el.dataset.sldBound==="1") return;
      var lo=parseFloat(el.dataset.min), hi=parseFloat(el.dataset.max);
      if(!isFinite(lo)||!isFinite(hi)||hi<=lo) return;
      el.dataset.sldBound="1";

      var isLog=el.dataset.scale==="log";
      var isMoney=el.hasAttribute("data-money");
      var st=parseFloat(el.dataset.step)||1;
      var dec=(String(st).split(".")[1]||"").length;
      var floor=Math.max(lo>0?lo:SLD_FLOOR, 1);
      var span=Math.log(hi/floor);

      /* ตำแหน่งหัวแถบ ⇄ ค่าเงิน */
      function posToVal(p){
        if(!isLog) return Math.min(hi, Math.max(lo, p));
        if(p<=0) return lo;
        var raw=floor*Math.exp(span*(p-1)/(SLD_POS-1));
        return sldSnap(raw, raw*(Math.exp(span/(SLD_POS-1))-1));
      }
      function valToPos(v){
        if(!isLog) return Math.min(hi, Math.max(lo, Math.round((v-lo)/st)*st+lo));
        if(v<=lo) return 0;
        if(v<=floor) return 1;
        return Math.round(1+(SLD_POS-1)*Math.log(v/floor)/span);
      }

      var box=D.createElement("div"); box.className="sld";
      var r=D.createElement("input");
      r.type="range";
      if(isLog){ r.min=0; r.max=SLD_POS; r.step=1; }
      else     { r.min=lo; r.max=hi;     r.step=st; }
      var lab=el.closest("label");
      r.setAttribute("aria-label","แถบเลื่อนสำหรับ "+((lab&&lab.textContent||"").trim().split("\n")[0]||el.id));

      var bub=D.createElement("span"); bub.className="sld-b";
      var ticks=D.createElement("div"); ticks.className="sld-t";
      /* ป้ายกลางแถบ — ปัดเหลือ 2 ตัวเลขนัยสำคัญ จะได้อ่านง่าย (140,000 ไม่ใช่ 141,000) */
      function sig2(v){
        if(!(Math.abs(v)>0)) return 0;
        var e=Math.pow(10,Math.floor(Math.log(Math.abs(v))/Math.LN10)-1);
        return e>=1 ? Math.round(v/e)*e : v;
      }
      var midVal=isLog ? sig2(posToVal(Math.round(SLD_POS/2)))
                       : Math.round(((lo+hi)/2)/st)*st;
      ticks.innerHTML="<span>"+shortNum(lo)+"</span><span class='mid'>"+shortNum(midVal)+"</span><span>"+
                      shortNum(hi)+(isMoney?"+":"")+"</span>";
      box.appendChild(bub); box.appendChild(r); box.appendChild(ticks);
      el.parentNode.insertBefore(box, el.nextSibling);

      function paint(){
        var pos=Number(r.value), max=Number(r.max), min=Number(r.min);
        var pc=max>min ? ((pos-min)/(max-min))*100 : 0;
        pc=Math.max(0,Math.min(100,pc));
        r.style.setProperty("--p", pc.toFixed(2)+"%");
        bub.style.left=pc.toFixed(2)+"%";
        var v=posToVal(pos);
        bub.textContent = isMoney ? shortNum(v) : (isLog? String(v) : v.toFixed(dec));
      }
      function fromField(){
        var v=Number(String(el.value).replace(/[^\d.\-]/g,""));
        if(!isFinite(v)) v=lo;
        var p=valToPos(v);
        r.value=Math.max(Number(r.min),Math.min(Number(r.max),p));  /* หัวแถบหยุดที่ปลาย แต่ไม่แก้ค่าในช่อง */
        paint();
      }
      r.addEventListener("input", function(){
        var v=posToVal(Number(r.value));
        el.value = isMoney ? v.toLocaleString("en-US") : (isLog? String(v) : v.toFixed(dec));
        paint();
        safeCalc();                                   /* เลื่อนแล้วเห็นผลทันที */
      }, false);
      ["pointerdown","focus"].forEach(function(ev){
        r.addEventListener(ev,function(){ box.classList.add("is-drag") },false); });
      ["pointerup","pointercancel","blur"].forEach(function(ev){
        r.addEventListener(ev,function(){ box.classList.remove("is-drag") },false); });
      el.addEventListener("input", fromField, false);
      fromField();
    }
    $("[data-min]",form).forEach(attachSlider);

    function calc(){
      clearErr();
      var income=num("income"), years=num("years"),
          debt=num("debt"), edu=num("edu"), asset=num("asset"),
          finalx=num("final");

      /* ── ตรวจความสมเหตุสมผลของค่าที่กรอก ── */
      if(years<5) years=5;
      if(years>30) years=30;
      var yEl=D.getElementById("years");
      if(yEl && Number(yEl.value)!==years) yEl.value=years;
      if(income<=0) showErr("ยังไม่ได้กรอกรายได้ต่อเดือน — ส่วน “ทดแทนรายได้” จะเป็น 0");

      var advEl = D.getElementById("advOn");
      var adv   = !!(advEl && advEl.checked);
      var g = adv ? num("infl")/100 : 0;
      var r = adv ? num("ret")/100  : 0;

      var yearly     = income*12;
      var incSimple  = yearly*years;                       // DIME แบบง่าย
      var incPv      = pvGrowing(yearly, g, r, years);     // คิดมูลค่าปัจจุบัน
      var incTotal   = adv ? incPv : incSimple;

      var gross = incTotal + debt + edu + finalx;
      var net   = gross - asset; if(net<0) net=0;

      var out = D.getElementById("sumOut");
      if(out){
        var txt = fmt(net)+" บาท";
        var changed = out.textContent !== txt;
        out.className="flash";
        out.textContent = txt;                       /* ใส่ค่าทันที ไม่หน่วง */
        W.setTimeout(function(){ out.className=""; },170);
        /* เอฟเฟกต์ประกายวิ่งผ่านตัวเลข — เล่นเฉพาะตอนค่าเปลี่ยนจริง
           และไม่เล่นระหว่างลากแถบเลื่อน (จะกระพริบรัว) */
        if(changed && !D.querySelector(".sld.is-drag")){
          var card = out.closest(".cout");
          W.setTimeout(function(){
            out.classList.remove("shine");
            if(card) card.classList.remove("pulse");
            void out.offsetWidth;                    /* บังคับให้เริ่มอนิเมชันใหม่ */
            out.classList.add("shine");
            if(card) card.classList.add("pulse");
          },180);
        }
      }
      setText("oInc",fmt(incTotal));
      setText("oDebt",fmt(debt));
      setText("oEdu",fmt(edu));
      setText("oFinal",fmt(finalx));
      setText("oAsset","-"+fmt(asset));
      var rf=D.getElementById("rowFinal"); if(rf) rf.style.display = finalx>0 ? "" : "none";

      setText("ratio", yearly>0
        ? "≈ "+(net/yearly).toFixed(1)+" เท่าของรายได้ต่อปี"
        : "กรอกรายได้ต่อเดือนเพื่อดูสัดส่วน");

      var f=D.getElementById("formula");
      if(f){
        var line1 = adv
          ? "ทดแทนรายได้ "+fmt(yearly)+" บาท/ปี × "+fmt(years)+" ปี (เงินเฟ้อ "+(g*100).toFixed(1)+"% · ผลตอบแทน "+(r*100).toFixed(1)+"%) = "+fmt(incTotal)
          : "รายได้ "+fmt(income)+" × 12 เดือน × "+fmt(years)+" ปี = "+fmt(incTotal);
        f.innerHTML =
          line1+"<br>"+
          "+ หนี้สิน "+fmt(debt)+" + การศึกษา "+fmt(edu)+
          (finalx>0 ? " + ค่าใช้จ่ายก้อนสุดท้าย "+fmt(finalx) : "")+" = "+fmt(gross)+"<br>"+
          "− สินทรัพย์เดิม "+fmt(asset)+" = <b>"+fmt(net)+" บาท</b>";
      }

      /* เทียบสองวิธีให้เห็นชัดเมื่อเปิดโหมดขั้นสูง */
      var cb=D.getElementById("cmpBox");
      if(cb){
        if(adv){
          cb.hidden=false;
          setText("cmpSimple", fmt(Math.max(0, incSimple+debt+edu+finalx-asset))+" บาท");
          setText("cmpPv",     fmt(net)+" บาท");
          var diff = incPv - incSimple;
          setText("cmpNote", Math.abs(diff)<1000
            ? "ผลตอบแทนโตทันเงินเฟ้อพอดี ตัวเลขสองวิธีจึงเท่ากัน"
            : (diff>0
               ? "เงินเฟ้อ "+(g*100).toFixed(1)+"% สูงกว่าผลตอบแทน "+(r*100).toFixed(1)+"% ครอบครัวจึงต้องการทุนเพิ่มอีก "+fmt(diff)+" บาท"
               : "ผลตอบแทน "+(r*100).toFixed(1)+"% สูงกว่าเงินเฟ้อ "+(g*100).toFixed(1)+"% เงินก้อนจึงงอกเงยช่วยได้ "+fmt(-diff)+" บาท"));
        } else { cb.hidden=true; }
      }

      var max = Math.max(incTotal,debt,edu,finalx,asset,1);
      setW("bInc",incTotal/max*100);
      setW("bDebt",debt/max*100);
      setW("bEdu",edu/max*100);
      setW("bFinal",finalx/max*100);
      setW("bAsset",asset/max*100);

      var msg;
      if(net<=0) msg="สินทรัพย์ปัจจุบันครอบคลุมภาระแล้ว แต่ควรทบทวนความคุ้มครองสุขภาพและโรคร้ายแรงเพิ่มเติม";
      else if(yearly<=0) msg="กรอกรายได้ต่อเดือนเพื่อให้ประเมินส่วนทดแทนรายได้ได้ครบถ้วน";
      else if(net/yearly<5) msg="ระดับความคุ้มครองค่อนข้างต่ำ หากมีผู้อยู่ในอุปการะควรพิจารณาเพิ่มทุนประกัน";
      else if(net/yearly>20) msg="ทุนประกันค่อนข้างสูง ลองตรวจสอบว่าจำนวนปีดูแลและหนี้สินที่กรอกสมเหตุสมผลหรือไม่";
      else msg="อยู่ในช่วงที่นักวางแผนการเงินส่วนใหญ่แนะนำ ควรตรวจสอบว่าเบี้ยรวมยังอยู่ราว 5–10% ของรายได้ทั้งปี";
      setText("hint", msg);

      var t=new Date();
      setText("stamp","คำนวณล่าสุด "+pad(t.getHours())+":"+pad(t.getMinutes())+":"+pad(t.getSeconds())+" · build "+BUILD);

      var s=D.getElementById("stale"); if(s) s.className="";
      console.log("[2Provi Group] คำนวณ:",{income:income,years:years,debt:debt,edu:edu,asset:asset,net:net});
      return net;
    }

    function safeCalc(e){
      if(e && e.preventDefault) e.preventDefault();
      try{ calc(); }
      catch(err){ console.error(err); showErr("คำนวณไม่สำเร็จ: "+err.message); }
      return false;
    }

    form.addEventListener("submit", safeCalc, false);
    form.onsubmit = safeCalc;
    var btn=D.getElementById("calcBtn");
    if(btn) btn.addEventListener("click", safeCalc, false);

    /* เว้นแถบเลื่อนไว้ ไม่งั้นเลื่อนเสร็จจะขึ้นป้าย "ค่าเปลี่ยนแล้ว" ทั้งที่คำนวณใหม่ให้แล้ว */
    $("input:not([type=range])",form).forEach(function(i){
      i.addEventListener("input", function(){
        var s=D.getElementById("stale"); if(s) s.className="on";
      }, false);
      i.addEventListener("keydown", function(e){
        if(e.key==="Enter"){ e.preventDefault(); safeCalc(); }
      }, false);
    });

    /* โหมดขั้นสูง: เปิด/ปิดแล้วคำนวณใหม่ทันที */
    var advOn=D.getElementById("advOn"), advFields=D.getElementById("advFields");
    if(advOn) advOn.addEventListener("change", function(){
      if(advFields) advFields.hidden = !advOn.checked;
      safeCalc();
    }, false);

    var rb=D.getElementById("resetBtn");
    if(rb) rb.addEventListener("click", function(){
      var def={income:"45,000",years:10,debt:"2,400,000",edu:"1,000,000",final:"200,000",asset:"500,000",infl:3,ret:4},k,el;
      for(k in def){ if(Object.prototype.hasOwnProperty.call(def,k)){
        el=D.getElementById(k);
        if(el){ el.value=def[k];
          /* แจ้ง input เพื่อให้แถบเลื่อนและคอมมาอัปเดตตาม */
          try{ el.dispatchEvent(new Event("input",{bubbles:true})); }catch(e){}
        } } }
      if(advOn){ advOn.checked=false; if(advFields) advFields.hidden=true; }
      safeCalc();
    }, false);

    safeCalc();
    W.LScalc = safeCalc;
    console.log("[2Provi Group] เครื่องคำนวณพร้อม "+BUILD);
  });

  /* ============================================================
     3. CHECKLIST PROGRESS
     ============================================================ */
  run("checklist", function(){
    var box=D.getElementById("chkList"); if(!box) return;
    var bar=$1("#chkBar i"), txt=D.getElementById("chkTxt");
    var boxes=$('input[type="checkbox"]',box);
    if(!boxes.length) return;
    function upd(){
      var done=0;
      boxes.forEach(function(b){ if(b.checked) done++; });
      var pct=done/boxes.length*100;
      if(bar) bar.style.width=pct.toFixed(1)+"%";
      if(txt) txt.textContent = (done===boxes.length)
        ? "🎉 ครบทั้ง "+boxes.length+" ข้อ พร้อมตัดสินใจอย่างมีข้อมูลแล้ว"
        : "เลือกไปแล้ว "+done+" จาก "+boxes.length+" ข้อ";
    }
    boxes.forEach(function(b){ b.addEventListener("change",upd,false); });
    upd();
  });

  /* ============================================================
     4. MYTH TOGGLE
     ============================================================ */
  run("myth", function(){
    $(".myth").forEach(function(m){
      m.setAttribute("tabindex","0");
      m.setAttribute("role","button");
      function t(){ m.classList.toggle("open"); }
      m.addEventListener("click",t,false);
      m.addEventListener("keydown",function(e){
        if(e.key==="Enter"||e.key===" "){ e.preventDefault(); t(); }
      },false);
    });
  });

  /* ============================================================
     5. REVEAL
     ============================================================ */
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

  /* ============================================================
     6. SCROLL (progress / nav / toTop)
     ============================================================ */
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

  /* ============================================================
     7. MENU
     ============================================================ */
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

  /* ============================================================
     8. COUNTERS
     ============================================================ */
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

  /* ============================================================
     9. SCROLL SPY
     ============================================================ */
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

  /* ============================================================
     10. TABS
     ============================================================ */
  run("tabs", function(){
    var tabs=$(".tab"); if(!tabs.length) return;
    tabs.forEach(function(t){
      t.addEventListener("click", function(){
        var pan=D.getElementById(t.getAttribute("data-p"));
        if(!pan) return;
        tabs.forEach(function(x){ x.classList.remove("act"); });
        $(".pan").forEach(function(x){ x.classList.remove("act"); });
        t.classList.add("act");
        pan.classList.add("act");
      },false);
    });
  });


  /* ============================================================
     11. BILLS — รวมยอดจากรายการจริงเสมอ
         (เดิมผลรวมเป็นตัวเลขที่พิมพ์มือไว้ จึงไม่ตรงกับรายการด้านบน)
     ============================================================ */
  run("bills", function(){
    var bills=$("[data-bill]"); if(!bills.length) return;
    function sign(n){
      var neg=n<0; n=Math.abs(Math.round(n));
      return (neg?"-":"+")+String(n).replace(/\B(?=(\d{3})+(?!\d))/g,",");
    }
    var totals=[];
    bills.forEach(function(bill){
      var sum=0;
      $("b[data-v]",bill).forEach(function(b){
        var v=Number(b.getAttribute("data-v"))||0;
        sum+=v;
        b.textContent = v===0 ? "0" : sign(v);
        b.className   = v>0 ? "pos" : (v<0 ? "neg" : "zero");
      });
      var t=$1("b[data-total]",bill);
      if(t){ t.textContent=sign(sum); t.className = sum>=0 ? "pos" : "neg"; }
      totals.push(sum);
    });
    var gv=D.getElementById("gapVal");
    if(gv && totals.length>=2){
      var gap=totals[1]-totals[0];
      gv.textContent=sign(gap)+" บาท";
      gv.className = gap>=0 ? "" : "neg";
    }
  });

  /* ============================================================
     12. IMAGES — ช่องใส่รูปภาพในแต่ละส่วนของหน้า
         • วางลิงก์รูป (URL) หรือเลือกไฟล์จากเครื่องก็ได้
         • ไฟล์จากเครื่องจะถูกย่อขนาดอัตโนมัติก่อนเก็บ กันพื้นที่เต็ม
         • จำไว้ในเครื่องนี้ (localStorage) และส่งออกเป็นโค้ดไปฝังถาวรได้
     ============================================================ */
  run("images", function(){
    var KEY="ls-images";
    var slots=$(".imgslot"); if(!slots.length) return;

    var store={};
    try{ store=JSON.parse(localStorage.getItem(KEY)||"{}")||{}; }catch(e){ store={}; }
    /* ค่าเริ่มต้นที่ฝังมากับไฟล์ (แก้ LS_IMAGES ด้านบนสุดของสคริปต์เพื่อให้ทุกคนเห็นเหมือนกัน) */
    var baked = (W.LS_IMAGES && typeof W.LS_IMAGES==="object") ? W.LS_IMAGES : {};

    function dataOf(id){
      var b=baked[id]||{}, u=store[id]||{};
      return { src:(u.src!==undefined?u.src:b.src)||"", caption:(u.caption!==undefined?u.caption:b.caption)||"" };
    }
    function save(){
      try{ localStorage.setItem(KEY, JSON.stringify(store)); quota(); }
      catch(e){ alert("บันทึกรูปไม่สำเร็จ พื้นที่เก็บในเบราว์เซอร์เต็ม ลองใช้ลิงก์รูปแทนการอัปโหลดไฟล์ค่ะ"); }
      if(D.body.classList.contains("imgedit")) refreshPanel();
    }
    function quota(){
      var q=D.getElementById("imgQuota"); if(!q) return;
      var bytes=0; try{ bytes=(localStorage.getItem(KEY)||"").length; }catch(e){}
      q.textContent="พื้นที่ที่ใช้อยู่ ≈ "+(bytes/1024).toFixed(0)+" KB (เบราว์เซอร์มักจำกัดราว 5,000 KB)";
    }

    function render(fig){
      var id=fig.getAttribute("data-slot"), d=dataOf(id);
      var img=$1("img",fig), cap=$1("figcaption",fig);
      if(d.src){
        if(!img){
          img=D.createElement("img");
          img.loading="lazy"; img.decoding="async";
          img.addEventListener("error", function(){
            fig.classList.add("empty");
            var ph=$1(".ph b",fig); if(ph) ph.textContent="⚠️";
            var pt=$1(".ph span",fig); if(pt) pt.textContent="เปิดรูปจากลิงก์นี้ไม่ได้ — ตรวจว่าเป็นลิงก์รูปโดยตรงและเปิดสาธารณะ";
          }, false);
          fig.insertBefore(img, fig.firstChild);
        }
        if(img.getAttribute("src")!==d.src) img.src=d.src;
        img.alt = d.caption || "ภาพประกอบเนื้อหา";
        fig.classList.remove("empty");
      }else{
        if(img) img.remove();
        fig.classList.add("empty");
      }
      if(cap) cap.textContent = d.src ? (d.caption||"") : "";
      var u=$1(".u-url",fig), c=$1(".u-cap",fig);
      if(u) u.value = /^data:/.test(d.src) ? "" : d.src;
      if(c) c.value = d.caption;
      var f=$1(".u-file-name",fig);
      if(f) f.textContent = /^data:/.test(d.src) ? "ใช้ไฟล์จากเครื่อง" : "";
    }

    /* ย่อรูปก่อนเก็บ ให้กว้างไม่เกิน 1600px และบีบเป็น JPEG */
    function shrink(file, cb){
      var fr=new FileReader();
      fr.onload=function(){
        var im=new Image();
        im.onload=function(){
          var MAX=1600, w=im.width, h=im.height;
          if(w>MAX){ h=Math.round(h*MAX/w); w=MAX; }
          try{
            var cv=D.createElement("canvas"); cv.width=w; cv.height=h;
            var cx=cv.getContext("2d");
            cx.fillStyle="#fff"; cx.fillRect(0,0,w,h);
            cx.drawImage(im,0,0,w,h);
            cb(cv.toDataURL("image/jpeg",0.82));
          }catch(e){ cb(fr.result); }
        };
        im.onerror=function(){ cb(fr.result); };
        im.src=fr.result;
      };
      fr.onerror=function(){ alert("อ่านไฟล์รูปไม่สำเร็จค่ะ"); };
      fr.readAsDataURL(file);
    }

    slots.forEach(function(fig){
      var id=fig.getAttribute("data-slot");
      if(!id) return;

      if(!$1(".ph",fig)){
        var ph=D.createElement("div");
        ph.className="ph";
        ph.innerHTML='<b>🖼️</b><span>ช่องใส่รูปภาพ · '+(fig.getAttribute("data-label")||id)+'</span>';
        fig.appendChild(ph);
      }
      if(!$1("figcaption",fig)) fig.appendChild(D.createElement("figcaption"));

      var bar=D.createElement("div");
      bar.className="imgbar";
      bar.innerHTML=
        '<span class="tag">'+(fig.getAttribute("data-label")||id)+'</span>'+
        '<input type="text" class="u-url" placeholder="วางลิงก์รูปภาพ https://…">'+
        '<button type="button" class="mini u-pick">📁 เลือกไฟล์</button>'+
        '<span class="u-file-name" style="font-size:.76rem;color:var(--muted)"></span>'+
        '<input type="file" class="u-file" accept="image/*">'+
        '<input type="text" class="u-cap" placeholder="คำบรรยายใต้ภาพ (ไม่ใส่ก็ได้)">'+
        '<button type="button" class="mini del u-del">ลบรูป</button>';
      fig.appendChild(bar);

      var url=$1(".u-url",bar), cap=$1(".u-cap",bar),
          file=$1(".u-file",bar), pick=$1(".u-pick",bar), del=$1(".u-del",bar);

      function set(k,v){ store[id]=store[id]||{}; store[id][k]=v; save(); render(fig); }

      url.addEventListener("change", function(){ set("src", url.value.trim()); }, false);
      url.addEventListener("keydown", function(e){ if(e.key==="Enter"){ e.preventDefault(); url.blur(); } }, false);
      cap.addEventListener("change", function(){ set("caption", cap.value); }, false);
      pick.addEventListener("click", function(){ file.click(); }, false);
      file.addEventListener("change", function(){
        var f=file.files && file.files[0]; if(!f) return;
        shrink(f, function(dataUrl){ set("src", dataUrl); });
        file.value="";
      }, false);
      del.addEventListener("click", function(){
        store[id]={src:"",caption:""}; save(); render(fig);
      }, false);

      render(fig);
    });

    /* ปุ่มลอย + แผงจัดการ */
    var fab=D.createElement("button");
    fab.id="imgFab"; fab.type="button"; fab.title="โหมดจัดการรูปภาพ";
    fab.setAttribute("aria-label","เปิด/ปิดโหมดจัดการรูปภาพ");
    fab.textContent="🖼️";
    /* [เอาออก] ปุ่มลอย 🖼️ "โหมดจัดการรูปภาพ" เป็นเครื่องมือของเจ้าของเว็บ
       ไม่ใช่ของผู้เข้าชม แต่เดิมถูกแสดงให้ทุกคนเห็น จึงไม่แนบเข้าหน้าเว็บแล้ว
       โค้ดส่วนที่เหลือยังทำงานปกติ รูปที่ตั้งไว้ใน window.LS_IMAGES ยังขึ้นเหมือนเดิม
       ถ้าต้องการใช้เครื่องมือนี้อีก ให้เอาเครื่องหมายคอมเมนต์ออกจากสองบรรทัดล่าง */
    /* D.body.appendChild(fab); */

    var panel=D.createElement("div");
    panel.id="imgPanel";
    panel.innerHTML=
      '<h4>🖼️ โหมดจัดการรูปภาพ</h4>'+
      '<p>ช่องใส่รูปจะปรากฏในทุกส่วนของหน้า ใส่ได้ทั้ง <b>ลิงก์รูป</b> และ <b>ไฟล์จากเครื่อง</b><br>'+
      'รูปที่ใส่จะถูกจำไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น — ถ้าต้องการให้ทุกคนเห็น ให้กด “คัดลอกโค้ด” '+
      'แล้ววางทับบรรทัด <code>window.LS_IMAGES</code> ในไฟล์ index.html</p>'+
      '<textarea id="imgCode" readonly spellcheck="false"></textarea>'+
      '<div class="prow">'+
        '<button type="button" class="mini" id="imgCopy">📋 คัดลอกโค้ด</button>'+
        '<button type="button" class="mini del" id="imgClear">ล้างรูปทั้งหมด</button>'+
        '<button type="button" class="mini" id="imgClose">ปิด</button>'+
      '</div>'+
      '<div id="imgQuota"></div>';
    /* D.body.appendChild(panel); */

    function code(){
      var out={}, k;
      slots.forEach(function(f){
        var id=f.getAttribute("data-slot"), d=dataOf(id);
        if(d.src) out[id]={src:d.src,caption:d.caption};
      });
      return "window.LS_IMAGES = "+JSON.stringify(out,null,2)+";";
    }
    function refreshPanel(){
      var ta=D.getElementById("imgCode");
      if(ta) ta.value=code();
      quota();
    }

    fab.addEventListener("click", function(){
      var on=D.body.classList.toggle("imgedit");
      fab.classList.toggle("on",on);
      panel.classList.toggle("on",on);
      fab.textContent = on ? "✕" : "🖼️";
      if(on) refreshPanel();
    }, false);

    D.getElementById("imgClose").addEventListener("click", function(){ fab.click(); }, false);
    D.getElementById("imgCopy").addEventListener("click", function(){
      var ta=D.getElementById("imgCode");
      ta.select(); ta.setSelectionRange(0,ta.value.length);
      var ok=false;
      try{ ok=D.execCommand("copy"); }catch(e){}
      if(!ok && navigator.clipboard) navigator.clipboard.writeText(ta.value).then(function(){},function(){});
      this.textContent = "✅ คัดลอกแล้ว";
      var b=this; W.setTimeout(function(){ b.textContent="📋 คัดลอกโค้ด"; },1600);
    }, false);
    D.getElementById("imgClear").addEventListener("click", function(){
      if(!W.confirm("ลบรูปทั้งหมดที่ใส่ไว้ในเครื่องนี้ใช่ไหม")) return;
      store={}; save();
      slots.forEach(render);
      refreshPanel();
    }, false);

    W.LSimages={ get:dataOf, code:code };
    console.log("[2Provi Group] ช่องใส่รูปภาพพร้อม "+slots.length+" จุด");
  });

  console.log("[2Provi Group] โหลดสมบูรณ์ "+BUILD);
})();
