(function(){
  "use strict";
  var D=document, W=window, ROOT=D.documentElement, BUILD="education v2.0";
  var $=W.P2.$, $1=W.P2.$1, run=W.P2.run;



  /* ============================================================
     เครื่องคำนวณค่าการศึกษาบุตร
     ============================================================ */
  run("calculator", function(){
    var form = D.getElementById("eForm");
    if(!form) return;

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


    /* ช่วงชั้น: [ชื่อ, อายุเริ่ม, อายุจบ(รวม), idของช่องกรอก, สีในกราฟ] */
    var LEVELS = [
      ["อนุบาล",      3,  5, "c1", "#bae6fd"],
      ["ประถม",       6, 11, "c2", "#7dd3fc"],
      ["มัธยม",      12, 17, "c3", "#38bdf8"],
      ["ปริญญาตรี",  18, 21, "c4", "#ffffff"]
    ];
    var END_AGE = 22;   /* จ่ายค่าเทอมงวดสุดท้ายตอนอายุ 21 เรียนจบตอน 22 */

    var PRESETS = {
      gov:     {c1:"22,000",  c2:"25,000",  c3:"30,000",  c4:"100,000"},
      mix:     {c1:"45,000",  c2:"55,000",  c3:"75,000",  c4:"130,000"},
      private: {c1:"84,000",  c2:"84,000",  c3:"95,000",  c4:"180,000"},
      bi:      {c1:"180,000", c2:"200,000", c3:"230,000", c4:"320,000"},
      inter:   {c1:"400,000", c2:"450,000", c3:"520,000", c4:"900,000"}
    };

    var errEl = D.getElementById("errbox");
    function showErr(msg){ if(errEl){ errEl.textContent = msg; errEl.className="on"; } }
    function clearErr(){ if(errEl){ errEl.textContent=""; errEl.className=""; } }

    $("[data-money]",form).forEach(bindMoney);
    $("[data-min]",form).forEach(attachSlider);

    var advEl = D.getElementById("advOn"), advBox = D.getElementById("advBox");
    function syncAdv(){ if(advBox) advBox.style.display = (advEl && advEl.checked) ? "" : "none"; }
    if(advEl) advEl.addEventListener("change", function(){ syncAdv(); safeCalc(); }, false);

    /* เลือกแนวโรงเรียน → เติมตัวเลขให้ */
    var presetEl = D.getElementById("preset"), lockPreset=false;
    if(presetEl){
      presetEl.addEventListener("change", function(){
        var p = PRESETS[presetEl.value];
        if(!p) return;                       /* "custom" ไม่ต้องเติมอะไร */
        lockPreset = true;
        for(var k in p){ if(Object.prototype.hasOwnProperty.call(p,k)){
          var el=D.getElementById(k);
          if(el){ el.value=p[k];
            try{ el.dispatchEvent(new Event("input",{bubbles:true})); }catch(e){}
          } } }
        lockPreset = false;
        safeCalc();
      }, false);
      /* ถ้าผู้ใช้แก้ตัวเลขเอง ให้สลับไปเป็น "กำหนดเอง" */
      ["c1","c2","c3","c4"].forEach(function(id){
        var el=D.getElementById(id); if(!el) return;
        el.addEventListener("input", function(){
          if(!lockPreset && presetEl.value!=="custom") presetEl.value="custom";
        }, false);
      });
    }

    /* ---- กราฟแท่งค่าใช้จ่ายรายปี ---- */
    function drawYears(rows){
      var svg=D.getElementById("ychart"); if(!svg) return;
      var W0=560,H0=180,PL=4,PR=4,PT=16,PB=26;
      var n=rows.length;
      if(!n){ D.getElementById("yBars").innerHTML=""; D.getElementById("yAxis").innerHTML=""; return; }
      var maxV=1; rows.forEach(function(r){ if(r.cost>maxV) maxV=r.cost; });
      var gw=(W0-PL-PR)/n, bw=Math.max(3, gw*0.72);
      var bars="", axis="";
      axis+='<line x1="'+PL+'" y1="'+(H0-PB)+'" x2="'+(W0-PR)+'" y2="'+(H0-PB)+
            '" stroke="rgba(255,255,255,.42)" stroke-width="1"/>';
      rows.forEach(function(r,i){
        var h=(H0-PT-PB)*(r.cost/maxV);
        var x=PL+gw*i+(gw-bw)/2, y=H0-PB-h;
        bars+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+
              Math.max(h,1).toFixed(1)+'" rx="2.5" fill="'+r.color+'" opacity=".92">'+
              '<title>อายุ '+r.age+' ปี · '+r.name+' · '+fmt(r.cost)+' บาท</title></rect>';
        if(n<=24 || i%2===0){
          axis+='<text x="'+(x+bw/2).toFixed(1)+'" y="'+(H0-10)+'" fill="rgba(255,255,255,.75)" '+
                'font-size="9.5" text-anchor="middle">'+r.age+'</text>';
        }
      });
      axis+='<text x="'+PL+'" y="'+(H0-PB+18)+'" fill="rgba(255,255,255,.55)" font-size="9.5">อายุลูก (ปี)</text>';
      D.getElementById("yBars").innerHTML=bars;
      D.getElementById("yAxis").innerHTML=axis;
    }

    function calc(){
      clearErr();
      var kage=num("kage"), saved=num("saved");
      if(kage<0) kage=0; if(kage>21) kage=21;
      var kEl=D.getElementById("kage");
      if(kEl && Number(kEl.value)!==kage){ kEl.value=kage;
        try{ kEl.dispatchEvent(new Event("input",{bubbles:true})); }catch(e){} }

      var adv = !!(advEl && advEl.checked);
      var gi = adv ? num("einf")/100 : 0.06;    /* เงินเฟ้อการศึกษา */
      var rr = adv ? num("eret")/100 : 0.03;    /* ผลตอบแทนเงินออม */

      /* ---- ไล่ทุกปีตั้งแต่วันนี้จนลูกเรียนจบ ---- */
      var rows=[], totalFuture=0, pvTotal=0, byLevel=[0,0,0,0];
      for(var a=Math.max(kage,LEVELS[0][1]); a<=LEVELS[3][2]; a++){
        var li=-1, L;
        for(var j=0;j<LEVELS.length;j++){ if(a>=LEVELS[j][1] && a<=LEVELS[j][2]){ li=j; break; } }
        if(li<0) continue;
        L=LEVELS[li];
        var t = a - kage;                       /* อีกกี่ปีจากวันนี้ */
        var base = num(L[3]);
        var cost = base * Math.pow(1+gi, t);    /* ราคาจริง ณ ปีนั้น */
        var pv   = cost / Math.pow(1+rr, t);    /* ย้อนกลับมาเป็นเงินวันนี้ */
        totalFuture += cost;
        pvTotal     += pv;
        byLevel[li] += pv;
        rows.push({age:a, name:L[0], cost:cost, color:L[4]});
      }

      if(!rows.length){
        showErr("ลูกอายุเกินช่วงที่คำนวณแล้ว (เกิน 21 ปี) — ลองปรับอายุลงมา");
      }

      var needToday = Math.max(0, pvTotal - saved);

      /* ---- ออมเดือนละเท่าไร: ทำให้มูลค่าปัจจุบันของเงินออมเท่ากับส่วนที่ขาด ---- */
      var monthsLeft = Math.max(1, Math.round((END_AGE - kage) * 12));
      var m = rr/12;
      var pmt = (Math.abs(m) < 1e-12)
              ? needToday/monthsLeft
              : needToday * m / (1 - Math.pow(1+m, -monthsLeft));

      /* ---- แสดงผล ---- */
      var out = D.getElementById("sumOut");
      if(out){
        var txt = fmt(needToday)+" บาท";
        var changed = out.textContent !== txt;
        out.className="flash";
        out.textContent = txt;
        W.setTimeout(function(){ out.className=""; },170);
        if(changed && !D.querySelector(".sld.is-drag")){
          var card = out.closest(".cout");
          W.setTimeout(function(){
            out.classList.remove("shine"); if(card) card.classList.remove("pulse");
            void out.offsetWidth;
            out.classList.add("shine"); if(card) card.classList.add("pulse");
          },180);
        }
      }

      setText("ratio", rows.length
        ? ("ครอบคลุมตั้งแต่ลูกอายุ "+rows[0].age+" ถึง "+rows[rows.length-1].age+" ปี รวม "+rows.length+" ปีการศึกษา")
        : "ยังไม่มีปีการศึกษาที่ต้องเตรียมเงิน");
      setText("kPmt", fmt(pmt)+" บาท");
      setText("kTotal", fmt(totalFuture)+" บาท");

      var base2 = Math.max(byLevel[0],byLevel[1],byLevel[2],byLevel[3],saved,1);
      ["1","2","3","4"].forEach(function(k,i){
        setText("o"+k, fmt(byLevel[i]));
        setW("b"+k, byLevel[i]/base2*100);
      });
      setText("o5","-"+fmt(Math.min(saved,pvTotal)));
      setW("b5", Math.min(saved,pvTotal)/base2*100);

      drawYears(rows);

      var f=D.getElementById("formula");
      if(f){
        f.innerHTML =
          "ค่าใช้จ่ายรวมที่จะจ่ายจริงตลอด "+rows.length+" ปี = <b>"+fmt(totalFuture)+" บาท</b> (ปรับเงินเฟ้อ "+(gi*100).toFixed(1)+"% แล้ว)<br>"+
          "คิดกลับเป็นเงินวันนี้ที่ผลตอบแทน "+(rr*100).toFixed(1)+"% = "+fmt(pvTotal)+" บาท<br>"+
          "− เงินที่เก็บไว้แล้ว "+fmt(saved)+" บาท = <b>ต้องเตรียมเพิ่ม "+fmt(needToday)+" บาท</b><br>"+
          "เฉลี่ยเป็นเงินออมเดือนละ "+fmt(pmt)+" บาท ต่อเนื่อง "+monthsLeft+" เดือน";
      }

      var hint=D.getElementById("hint");
      if(hint){
        var msg;
        if(needToday<=0) msg="✅ เงินที่เก็บไว้ครอบคลุมค่าการศึกษาตามสมมติฐานนี้แล้ว — อย่าลืมทบทวนทุกปีเมื่อค่าเทอมจริงเปลี่ยน";
        else if(kage<=6) msg="🟢 ยังมีเวลาเหลือเยอะ ข้อได้เปรียบที่สุดของคุณคือเวลา ไม่ใช่จำนวนเงิน — เริ่มด้วยจำนวนที่ทำได้จริงทุกเดือนดีกว่ารอให้พร้อม";
        else if(kage<=12) msg="🟡 เวลาเริ่มจำกัดแล้ว ควรแยกบัญชีเงินการศึกษาออกจากเงินใช้จ่ายประจำวันให้ชัดเจน";
        else msg="🔴 เหลือเวลาไม่มาก อาจต้องพิจารณาทั้งการเพิ่มเงินออม ปรับเป้าหมายโรงเรียน และเตรียมทางเลือกอย่าง กยศ. ไว้ควบคู่กัน";
        hint.textContent = msg + " · ตัวเลขนี้เป็นการประมาณเพื่อการวางแผน ไม่ใช่การรับประกันผลตอบแทน และยังไม่รวมค่าใช้จ่ายพิเศษ เช่น ค่าแรกเข้า หรือการเรียนต่อต่างประเทศ";
      }

      var d=new Date();
      setText("stamp","คำนวณล่าสุด "+pad(d.getHours())+":"+pad(d.getMinutes())+":"+pad(d.getSeconds())+
              " · เงินเฟ้อการศึกษา "+(gi*100).toFixed(1)+"% · ผลตอบแทน "+(rr*100).toFixed(1)+"%");
      var st=D.getElementById("stale"); if(st) st.className="";
    }

    function safeCalc(){ try{ calc(); }catch(e){ console.error("[2Provi Group] calc:",e); showErr("คำนวณไม่สำเร็จ — ลองตรวจตัวเลขที่กรอกอีกครั้ง"); } }

    D.getElementById("calcBtn").addEventListener("click", safeCalc, false);
    $("input:not([type=range])",form).forEach(function(i){
      i.addEventListener("input", function(){
        var st=D.getElementById("stale"); if(st) st.className="on";
      }, false);
    });
    D.getElementById("resetBtn").addEventListener("click", function(){
      var def={kage:3,c1:"45,000",c2:"55,000",c3:"75,000",c4:"130,000",saved:"150,000",einf:6,eret:3},k,el;
      for(k in def){ if(Object.prototype.hasOwnProperty.call(def,k)){
        el=D.getElementById(k);
        if(el){ el.value=def[k];
          try{ el.dispatchEvent(new Event("input",{bubbles:true})); }catch(e){}
        } } }
      if(presetEl) presetEl.value="mix";
      if(advEl){ advEl.checked=true; syncAdv(); }
      safeCalc();
    }, false);

    syncAdv();
    safeCalc();
  });
  console.log("[2Provi] "+BUILD+" พร้อมใช้งาน");
})();
