(function(){
  "use strict";
  var D=document, W=window, ROOT=D.documentElement, BUILD="retire v2.0";
  var $=W.P2.$, $1=W.P2.$1, run=W.P2.run;



  /* ============================================================
     เครื่องคำนวณเงินก้อนเกษียณ
     ============================================================ */
  run("calculator", function(){
    var form = D.getElementById("rForm");
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


    /* ---- มูลค่าปัจจุบันของรายรับคงที่ (บำนาญ ไม่โตตามเงินเฟ้อ) ---- */
    function pvLevel(C, r, n){
      if(n<=0 || C<=0) return 0;
      if(Math.abs(r) < 1e-9) return C*n;
      return C * (1 - Math.pow(1+r, -n)) / r;
    }
    /* ---- มูลค่าอนาคตของการออมรายเดือน (ทบต้นรายเดือน) ---- */
    function fvMonthly(C, rYear, years){
      var m = rYear/12, N = Math.round(years*12);
      if(N<=0 || C<=0) return 0;
      if(Math.abs(m) < 1e-12) return C*N;
      return C * (Math.pow(1+m, N) - 1) / m;
    }
    /* ---- ต้องออมเดือนละเท่าไรจึงได้เงินก้อน FV ---- */
    function pmtFor(FV, rYear, years){
      var m = rYear/12, N = Math.round(years*12);
      if(N<=0) return 0;
      if(Math.abs(m) < 1e-12) return FV/N;
      return FV * m / (Math.pow(1+m, N) - 1);
    }

    var errEl = D.getElementById("errbox");
    function showErr(msg){ if(errEl){ errEl.textContent = msg; errEl.className="on"; } }
    function clearErr(){ if(errEl){ errEl.textContent=""; errEl.className=""; } }

    $("[data-money]",form).forEach(bindMoney);
    $("[data-min]",form).forEach(attachSlider);

    var advEl = D.getElementById("advOn"), advBox = D.getElementById("advBox");
    function syncAdv(){ if(advBox) advBox.style.display = (advEl && advEl.checked) ? "" : "none"; }
    if(advEl) advEl.addEventListener("change", function(){ syncAdv(); safeCalc(); }, false);

    /* ---- กราฟเส้นเงินคงเหลือรายปี ---- */
    function drawChart(startAge, endAgePlan, series, needSeries){
      var svg = D.getElementById("gchart"); if(!svg) return;
      var W0=560, H0=190, PL=6, PR=6, PT=10, PB=24;
      var n = series.length; if(n<2) return;
      var maxV = 1;
      series.concat(needSeries).forEach(function(v){ if(v>maxV) maxV=v; });
      function X(i){ return PL + (W0-PL-PR) * (i/(n-1)); }
      function Y(v){ return PT + (H0-PT-PB) * (1 - Math.max(0,v)/maxV); }
      function path(arr){
        return arr.map(function(v,i){ return (i?"L":"M") + X(i).toFixed(1) + " " + Y(v).toFixed(1); }).join(" ");
      }
      var line = path(series);
      D.getElementById("gLine").setAttribute("d", line);
      D.getElementById("gNeed").setAttribute("d", path(needSeries));
      D.getElementById("gArea").setAttribute("d",
        line + " L " + X(n-1).toFixed(1) + " " + (H0-PB) + " L " + X(0).toFixed(1) + " " + (H0-PB) + " Z");

      /* เส้นฐาน + ป้ายอายุ */
      var g = "", marks = "";
      g += '<line x1="'+PL+'" y1="'+(H0-PB)+'" x2="'+(W0-PR)+'" y2="'+(H0-PB)+
           '" stroke="rgba(255,255,255,.42)" stroke-width="1"/>';
      var stepAge = (endAgePlan-startAge) > 40 ? 10 : 5;
      for(var a=Math.ceil(startAge/stepAge)*stepAge; a<=endAgePlan; a+=stepAge){
        var i = a-startAge; if(i<0||i>n-1) continue;
        g += '<line x1="'+X(i).toFixed(1)+'" y1="'+PT+'" x2="'+X(i).toFixed(1)+'" y2="'+(H0-PB)+
             '" stroke="rgba(255,255,255,.13)" stroke-width="1"/>';
        g += '<text x="'+X(i).toFixed(1)+'" y="'+(H0-7)+'" fill="rgba(255,255,255,.8)" font-size="10.5" '+
             'text-anchor="middle">'+a+'</text>';
      }
      /* จุดที่เงินหมด */
      for(var i2=1;i2<n;i2++){
        if(series[i2]<=0 && series[i2-1]>0){
          marks += '<circle cx="'+X(i2).toFixed(1)+'" cy="'+Y(0).toFixed(1)+'" r="4.5" fill="#fecaca"/>';
          marks += '<text x="'+X(i2).toFixed(1)+'" y="'+(Y(0)-9).toFixed(1)+'" fill="#fecaca" font-size="10.5" '+
                   'font-weight="700" text-anchor="middle">เงินหมด '+(startAge+i2)+' ปี</text>';
          break;
        }
      }
      D.getElementById("gGrid").innerHTML = g;
      D.getElementById("gMarks").innerHTML = marks;
    }

    function calc(){
      clearErr();
      var age=num("age"), rage=num("rage"), eage=num("eage");
      var exp=num("exp"), pen=num("pen"), have=num("have"), save=num("save");

      /* ---- ตรวจความสมเหตุสมผล ---- */
      if(age<20) age=20; if(age>69) age=69;
      if(rage<=age){ rage=age+1; showErr("อายุเกษียณต้องมากกว่าอายุปัจจุบัน — ปรับให้เป็น "+rage+" ปีให้แล้ว"); }
      if(eage<=rage){ eage=rage+1; showErr("อายุที่วางแผนต้องมากกว่าอายุเกษียณ — ปรับให้เป็น "+eage+" ปีให้แล้ว"); }
      ["age","rage","eage"].forEach(function(id){
        var el=D.getElementById(id), v=(id==="age"?age:id==="rage"?rage:eage);
        if(el && Number(el.value)!==v){ el.value=v;
          try{ el.dispatchEvent(new Event("input",{bubbles:true})); }catch(e){}
        }
      });

      var adv = !!(advEl && advEl.checked);
      var g  = adv ? num("infl")/100 : 0.03;
      var R1 = adv ? num("r1")/100   : 0.05;
      var R2 = adv ? num("r2")/100   : 0.03;

      var n1 = rage - age;          /* ปีที่เหลือให้สะสม */
      var n2 = eage - rage;         /* ปีที่ต้องใช้เงิน  */

      /* ค่าใช้จ่ายปีแรกหลังเกษียณ = ราคาวันนี้ ปรับเงินเฟ้อ n1 ปี */
      var expY0 = exp * 12 * Math.pow(1+g, n1);
      var penY  = pen * 12;

      var pvExp = pvGrowing(expY0, g, R2, n2);   /* ค่าใช้จ่ายโตตามเงินเฟ้อ */
      var pvPen = pvLevel(penY, R2, n2);         /* บำนาญคงที่ ไม่โตตามเงินเฟ้อ */
      var need  = Math.max(0, pvExp - pvPen);

      var fvHave = have * Math.pow(1+R1, n1);
      var fvSave = fvMonthly(save, R1, n1);
      var willHave = fvHave + fvSave;
      var gap = need - willHave;

      /* ---- แสดงผล ---- */
      var out = D.getElementById("sumOut");
      if(out){
        var txt = fmt(need)+" บาท";
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

      setText("ratio", "เพื่อใช้จ่ายเดือนละ "+fmt(exp)+" บาท (ราคาวันนี้) ตั้งแต่อายุ "+rage+" ถึง "+eage+" ปี");
      setText("kHave", fmt(willHave)+" บาท");

      var gapBox = D.getElementById("kGapBox"), pmtBox = D.getElementById("kPmtBox");
      if(gap > 0){
        setText("kGapLbl","ยังขาดอยู่");
        setText("kGap", fmt(gap)+" บาท");
        setText("kPmt", fmt(pmtFor(gap,R1,n1))+" บาท");
        if(gapBox) gapBox.className = "kpi bad";
        if(pmtBox) pmtBox.className = "kpi bad";
      }else{
        setText("kGapLbl","เกินเป้าหมายแล้ว");
        setText("kGap", "+"+fmt(-gap)+" บาท");
        setText("kPmt", "0 บาท");
        if(gapBox) gapBox.className = "kpi ok";
        if(pmtBox) pmtBox.className = "kpi ok";
      }

      var base = Math.max(pvExp, willHave, 1);
      setText("oExp", fmt(pvExp));   setW("bExp",  pvExp/base*100);
      setText("oPen", "-"+fmt(pvPen)); setW("bPen", pvPen/base*100);
      setText("oHave", fmt(fvHave));  setW("bHave", fvHave/base*100);
      setText("oSave", fmt(fvSave));  setW("bSave", fvSave/base*100);

      /* ---- กราฟ: เงินคงเหลือรายปีตั้งแต่วันนี้ถึงอายุที่วางแผน ---- */
      var series=[], needLine=[], bal=have, k;
      for(k=0; k<=(eage-age); k++){
        series.push(Math.max(0,bal));
        /* เส้นอ้างอิง: ยอดที่ควรมีในแต่ละปีเพื่อให้พอดีถึงอายุที่วางแผน */
        if(k<=n1) needLine.push(need*(k/Math.max(n1,1)));
        else{
          var left = n2-(k-n1);
          var e0 = exp*12*Math.pow(1+g, k);
          needLine.push(Math.max(0, pvGrowing(e0,g,R2,left) - pvLevel(penY,R2,left)));
        }
        if(k < n1){
          bal = bal*(1+R1) + fvMonthly(save,R1,1);
        }else{
          var spend = exp*12*Math.pow(1+g,k) - penY;
          bal = bal*(1+R2) - Math.max(0,spend);
        }
      }
      drawChart(age, eage, series, needLine);

      /* ---- สูตรที่ใช้ ---- */
      var f=D.getElementById("formula");
      if(f){
        f.innerHTML =
          "ค่าใช้จ่ายปีแรกหลังเกษียณ = "+fmt(exp)+" × 12 × (1+"+(g*100).toFixed(1)+"%)<sup>"+n1+"</sup> = "+fmt(expY0)+" บาท/ปี<br>"+
          "มูลค่าปัจจุบัน ณ วันเกษียณของค่าใช้จ่าย "+n2+" ปี = "+fmt(pvExp)+" บาท<br>"+
          "− มูลค่าปัจจุบันของรายได้ประจำ "+fmt(pen)+" บาท/เดือน = "+fmt(pvPen)+" บาท<br>"+
          "<b>= เงินก้อนที่ต้องมี "+fmt(need)+" บาท</b>";
      }

      var hint=D.getElementById("hint");
      if(hint){
        var msg;
        if(gap<=0) msg = "✅ ตามสมมติฐานนี้ แผนของคุณครอบคลุมแล้ว — ควรทบทวนอีกครั้งหากค่าใช้จ่ายหรือผลตอบแทนเปลี่ยน และอย่าลืมความคุ้มครองค่ารักษาพยาบาลซึ่งไม่ได้รวมอยู่ในตัวเลขนี้";
        else if(gap/Math.max(need,1) < 0.25) msg = "🟡 ยังขาดอยู่บ้าง แต่ช่องว่างไม่กว้าง — เพิ่มเงินออมอีกเล็กน้อยหรือเลื่อนเกษียณออกไป 1–2 ปี ก็มักปิดได้";
        else msg = "🔴 ช่องว่างค่อนข้างกว้าง — ลองปรับหลายทางพร้อมกัน ทั้งออมเพิ่ม ลดค่าใช้จ่ายเป้าหมาย และเลื่อนวันเกษียณ จะเจ็บน้อยกว่าฝืนทางเดียว";
        hint.textContent = msg + " · ตัวเลขนี้เป็นการประมาณเพื่อการวางแผน ไม่ใช่การรับประกันผลตอบแทน และยังไม่รวมภาษีกับค่าธรรมเนียม";
      }

      var d=new Date();
      setText("stamp","คำนวณล่าสุด "+pad(d.getHours())+":"+pad(d.getMinutes())+":"+pad(d.getSeconds())+" · เหลือเวลาสะสม "+n1+" ปี · ใช้เงิน "+n2+" ปี");
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
      var def={age:35,rage:60,eage:90,exp:"25,000",pen:"5,000",have:"800,000",save:"8,000",infl:3,r1:5,r2:3},k,el;
      for(k in def){ if(Object.prototype.hasOwnProperty.call(def,k)){
        el=D.getElementById(k);
        if(el){ el.value=def[k];
          try{ el.dispatchEvent(new Event("input",{bubbles:true})); }catch(e){}
        } } }
      if(advEl){ advEl.checked=true; syncAdv(); }
      safeCalc();
    }, false);

    syncAdv();
    safeCalc();
  });
  console.log("[2Provi] "+BUILD+" พร้อมใช้งาน");
})();
