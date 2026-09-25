/* ══════════════════════════════════════════════════════════════════════
   video.js — วิดีโอ YouTube ที่เล่นเองในหน้าเนื้อหา
   (money / health / retire / education)

   สิ่งที่ทำไม่ได้ และเหตุผล
   ───────────────────────
   "เล่นเองพร้อมเสียง" ทำไม่ได้ ไม่ใช่ข้อจำกัดของ YouTube แต่เป็นนโยบาย
   ของเบราว์เซอร์เอง Chrome/Safari/Firefox/Edge บล็อกการเล่นอัตโนมัติที่มี
   เสียงไว้ทั้งหมดถ้าผู้ใช้ยังไม่เคยกดอะไรบนหน้านั้น ทางที่ใช้ได้จริงคือ
   เริ่มด้วยปิดเสียง (mute=1) แล้วมีปุ่มให้กดเปิดเสียง เพราะการกดปุ่มนับเป็น
   user interaction เสียงจึงมาได้ทันที

   สิ่งที่สคริปต์นี้จัดการให้
   ───────────────────────
   1) ไม่แตะ YouTube จนกว่าหน้าจะโหลดเสร็จ (load + requestIdleCallback)
      และเลื่อนใกล้ถึงกล่องแล้ว — iframe ลากของมาราว 1-1.5MB ถ้าปล่อยให้
      เริ่มระหว่างโหลด มันจะแย่งแบนด์วิดท์กับรูปและฟอนต์ของหน้าเอง
   2) ปุ่มเปิดเสียงสั่งผ่าน postMessage ของ enablejsapi ไม่ต้องโหลด
      iframe_api เพิ่มอีกไฟล์
   3) ถ้า postMessage ไม่ตอบ (บางเบราว์เซอร์/ส่วนขยายบล็อก) จะสร้าง iframe
      ใหม่แบบมีเสียงทันทีในจังหวะที่ยังอยู่ใน user gesture จึงยังเล่นได้
   4) iOS ตอน Low Power Mode และ Chrome Android ตอน Data Saver บล็อกแม้
      ปิดเสียง — ถ้าเลยเวลาแล้วยังไม่เริ่มเล่น จะคืนภาพปกกับปุ่มเล่นให้
      ผู้ใช้กดเอง ไม่ปล่อยให้เห็นกรอบดำเปล่า ๆ
   5) เคารพ prefers-reduced-motion — เครื่องที่ตั้งค่าลดการเคลื่อนไหวไว้
      จะไม่เล่นเอง แสดงภาพปกกับปุ่มเล่นแทน
      (ถ้าไม่ต้องการข้อนี้ ลบบล็อก reduce ออกได้ ทำเครื่องหมายไว้ให้แล้ว)

   รองรับหลายกล่องในหน้าเดียว แต่ละกล่องทำงานแยกกันอิสระ
   ใส่รหัสวิดีโอที่แอตทริบิวต์ data-yt ของ .ytb
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var ORIGIN = "https://www.youtube.com";

  /* รอให้หน้าโหลดเสร็จก่อนค่อยแตะ YouTube */
  function afterLoad(fn) {
    function go() {
      if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 1500 });
      else setTimeout(fn, 250);
    }
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, false);
  }

  function setup(box) {
    var id = (box.getAttribute("data-yt") || "").trim();
    /* ยังไม่ได้ใส่รหัสวิดีโอ — ซ่อนทั้งส่วนไปเลย ดีกว่าโชว์กรอบว่าง */
    if (!id || id === "VIDEO_ID") {
      var sec = box.closest(".vidsec");
      (sec || box).style.display = "none";
      return;
    }

    var frame = box.querySelector(".ytb-frame");
    var ph = box.querySelector(".ytb-ph");
    var snd = box.querySelector(".ytb-sound");
    if (!frame || !ph || !snd) return;

    var iframe = null;
    var apiReady = false;   /* iframe ตอบ postMessage กลับมาแล้วหรือยัง */
    var everPlayed = false; /* เคยเริ่มเล่นจริงหรือยัง ใช้จับกรณีเครื่องบล็อก */
    var muted = true;
    var pingTimer = null;
    var watchTimer = null;

    /* ── ภาพปก ──
       โหลดเมื่อจำเป็นเท่านั้น เส้นทางปกติวิดีโอเล่นเองอยู่แล้ว ภาพปกจะถูก
       ซ่อนทันทีโดยไม่มีใครเห็น โหลดไว้ก่อนก็เสียเปล่า ~20KB
       maxresdefault ไม่มีทุกคลิป ถ้าไม่มีก็ถอยไปใช้ hqdefault ที่มีเสมอ */
    var pimg = ph.querySelector("img");
    var posterAsked = false;
    function ensurePoster() {
      if (posterAsked || !pimg) return;
      posterAsked = true;
      pimg.onerror = function () {
        this.onerror = null;
        this.src = "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/hqdefault.jpg";
      };
      pimg.src = "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/maxresdefault.jpg";
    }

    function paintSound() {
      snd.textContent = muted ? "🔇 เปิดเสียง" : "🔊 ปิดเสียง";
      snd.setAttribute("aria-label", muted ? "เปิดเสียงวิดีโอ" : "ปิดเสียงวิดีโอ");
      snd.setAttribute("aria-pressed", muted ? "false" : "true");
    }

    function showPoster(show) {
      if (show) ensurePoster();
      ph.hidden = !show;
      /* ยังไม่มี iframe ก็ยังไม่มีอะไรให้เปิดเสียง */
      snd.hidden = show || !iframe;
    }

    function cmd(func, args) {
      if (!iframe || !iframe.contentWindow) return;
      try {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: func, args: args || [] }),
          ORIGIN
        );
      } catch (e) {
        /* ปล่อยผ่าน ถ้าคุยไม่ได้จะมีทางสำรองที่ปุ่มเปิดเสียงอยู่แล้ว */
      }
    }

    /* ต้องส่ง listening เข้าไปก่อน YouTube ถึงจะยอมส่งสถานะกลับออกมา */
    function ping() {
      if (!iframe || !iframe.contentWindow) return;
      try {
        iframe.contentWindow.postMessage(JSON.stringify({ event: "listening" }), ORIGIN);
      } catch (e) {}
    }

    window.addEventListener(
      "message",
      function (e) {
        if (!iframe || e.source !== iframe.contentWindow) return;
        if (String(e.origin).indexOf("youtube.com") < 0) return;

        var d;
        try {
          d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        } catch (x) {
          return;
        }
        if (!d) return;

        if (d.event === "onReady" || d.event === "initialDelivery" || d.event === "infoDelivery") {
          apiReady = true;
        }

        var info = d.info || (d.event === "onStateChange" ? { playerState: d.info } : null);
        if (!info) return;

        if (typeof info.muted === "boolean") {
          muted = info.muted;
          paintSound();
        }
        /* 1 = กำลังเล่น, 3 = กำลังโหลดช่วงถัดไป — ทั้งคู่แปลว่าไม่โดนบล็อก */
        if (info.playerState === 1 || info.playerState === 3) {
          everPlayed = true;
          showPoster(false);
        }
      },
      false
    );

    function srcFor(autoplay, startMuted) {
      return (
        ORIGIN +
        "/embed/" +
        encodeURIComponent(id) +
        "?autoplay=" + (autoplay ? "1" : "0") +
        "&mute=" + (startMuted ? "1" : "0") +
        /* iOS จะเด้งเต็มจอถ้าไม่มี playsinline */
        "&playsinline=1" +
        /* วนซ้ำวิดีโอเดี่ยวต้องระบุ playlist เป็นรหัสตัวเองด้วย */
        "&loop=1&playlist=" + encodeURIComponent(id) +
        "&rel=0&iv_load_policy=3" +
        "&enablejsapi=1&origin=" + encodeURIComponent(window.location.origin)
      );
    }

    function build(autoplay, startMuted) {
      if (iframe) return;

      iframe = document.createElement("iframe");
      iframe.src = srcFor(autoplay, startMuted);
      iframe.title = box.getAttribute("data-title") || "วิดีโอแนะนำ";
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      frame.insertBefore(iframe, ph);

      muted = !!startMuted;
      paintSound();
      showPoster(false);

      /* เคาะถามสถานะช่วงแรก ๆ จนกว่าจะติดต่อได้ */
      var n = 0;
      pingTimer = setInterval(function () {
        ping();
        if (++n > 16 || apiReady) clearInterval(pingTimer);
      }, 250);

      if (autoplay) {
        /* เลยเวลานี้แล้วยังไม่เริ่มเล่น แปลว่าเครื่องบล็อกไว้ (Low Power Mode /
           Data Saver) คืนภาพปกให้กดเอง ดีกว่าปล่อยให้เห็นกรอบดำนิ่ง ๆ */
        watchTimer = setTimeout(function () {
          if (!everPlayed) showPoster(true);
        }, 3000);
      }
    }

    function rebuild(startMuted) {
      if (pingTimer) clearInterval(pingTimer);
      if (watchTimer) clearTimeout(watchTimer);
      if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
      iframe = null;
      apiReady = false;
      everPlayed = false;
      build(true, startMuted);
    }

    ph.addEventListener(
      "click",
      function () {
        /* กดเองแล้ว = user gesture เปิดเสียงได้เลยตั้งแต่ต้น */
        if (iframe) {
          showPoster(false);
          cmd("unMute");
          cmd("setVolume", [100]);
          cmd("playVideo");
          muted = false;
          paintSound();
        } else {
          build(true, false);
        }
      },
      false
    );

    snd.addEventListener(
      "click",
      function () {
        if (!apiReady) {
          /* คุยกับตัวเล่นไม่ได้ ใช้ทางอ้อม: สร้างใหม่ตรงนี้เลย ยังอยู่ในจังหวะ
             ที่ผู้ใช้เพิ่งกด เบราว์เซอร์จึงยอมให้เล่นพร้อมเสียง */
          rebuild(!muted ? true : false);
          muted = !muted;
          paintSound();
          return;
        }
        if (muted) {
          cmd("unMute");
          cmd("setVolume", [100]);
          cmd("playVideo");
          muted = false;
        } else {
          cmd("mute");
          muted = true;
        }
        paintSound();
      },
      false
    );

    paintSound();

    var reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      /* ── ลบบล็อกนี้ถ้าอยากให้เล่นเองทุกเครื่องโดยไม่สนค่าลดการเคลื่อนไหว ── */
      showPoster(true);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      afterLoad(function () { build(true, true); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            io.disconnect();
            afterLoad(function () { build(true, true); });
            return;
          }
        }
      },
      { rootMargin: "250px 0px" }
    );
    io.observe(box);
  }

  function boot() {
    var boxes = document.querySelectorAll(".ytb");
    for (var i = 0; i < boxes.length; i++) setup(boxes[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, false);
  else boot();
})();
