(function () {
      "use strict";

      /* ══════════════════════════════════════════════════════════
         1) แถบเลื่อนระดับการศึกษา
         ══════════════════════════════════════════════════════════ */
      var EDU = ["ต่ำกว่าปริญญาตรี", "ปริญญาตรี", "สูงกว่าปริญญาตรี"];

      var range = document.getElementById("eduRange");
      var hidden = document.getElementById("education");
      var labels = document.getElementById("eduLabels");

      function paintEdu() {
        var v = Number(range.value);
        if (!(v >= 0 && v <= 2)) v = 1;

        /* เติมสีแถบให้ตรงกับตำแหน่งหัวเลื่อน (0% / 50% / 100%) */
        range.style.setProperty("--p", (v / 2) * 100 + "%");

        /* ส่งเป็นข้อความไทย ไม่ใช่ 0/1/2 และบอกโปรแกรมอ่านหน้าจอด้วย */
        hidden.value = EDU[v];
        range.setAttribute("aria-valuetext", EDU[v]);

        var spans = labels.getElementsByTagName("span");
        for (var i = 0; i < spans.length; i++) {
          spans[i].className = i === v ? "on" : "";
        }
      }

      range.addEventListener("input", paintEdu, false);
      range.addEventListener("change", paintEdu, false);

      /* กดที่ข้อความใต้แถบเพื่อเลือกระดับนั้นได้เลย */
      labels.addEventListener(
        "click",
        function (e) {
          var t = e.target;
          if (!t || t.tagName !== "SPAN") return;
          var v = t.getAttribute("data-v");
          if (v === null) return;
          range.value = v;
          paintEdu();
        },
        false
      );

      paintEdu();

      /* ══════════════════════════════════════════════════════════
         2) ส่งใบสมัคร
         ══════════════════════════════════════════════════════════ */

      /* วาง URL ที่ได้จากการ Deploy Google Apps Script แบบ Web App
         แนะนำให้ใช้ชีตหรือแท็บแยกจากฟอร์ม "ขอรับข้อเสนอ"
         ฝั่งสคริปต์แยกได้จากค่า formType ที่ส่งไปด้วย */
      var GOOGLE_SCRIPT_URL =
        "https://script.google.com/macros/s/AKfycbxcjeRsdclsY_iV-xSd2VyXe10eBBawiYAhX3PxmPBtVJfpI1mliu8bwPB9fPqSOI0f/exec";

      var form = document.getElementById("joinForm");
      var submitButton = document.getElementById("submitButton");
      var errorBox = document.getElementById("formError");

      function val(id) {
        var el = document.getElementById(id);
        return el ? String(el.value).trim() : "";
      }

      function showError(html) {
        errorBox.innerHTML = html;
        errorBox.className = "form-error on";
        errorBox.scrollIntoView({ block: "nearest" });
      }

      function clearError() {
        errorBox.textContent = "";
        errorBox.className = "form-error";
      }

      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearError();

        /* ตรวจช่องบังคับเอง เพื่อให้ข้อความเตือนเป็นภาษาไทยและอยู่ในหน้า */
        if (!val("name")) {
          showError("กรุณากรอกชื่อ-นามสกุล");
          document.getElementById("name").focus();
          return;
        }
        if (!val("phone")) {
          showError("กรุณากรอกเบอร์โทรศัพท์ เพื่อให้เราติดต่อกลับได้");
          document.getElementById("phone").focus();
          return;
        }
        if (!document.getElementById("consent").checked) {
          showError("กรุณาติ๊กยอมรับให้เราติดต่อกลับ ก่อนส่งใบสมัคร");
          document.getElementById("consent").focus();
          return;
        }

        var formData = {
          formType: "สมัครตัวแทน",
          name: val("name"),
          phone: val("phone"),
          email: val("email"),
          province: val("province"),
          age: val("age"),
          job: val("job"),
          education: val("education"),
          experience: val("experience"),
          license: val("license"),
          workType: val("workType"),
          callTime: val("callTime"),
          message: val("message"),
          submittedAt: new Date().toISOString()
        };

        submitButton.disabled = true;
        submitButton.textContent = "กำลังส่งข้อมูล...";

        try {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(formData)
          });

          window.location.href = "thank-you.html";
        } catch (error) {
          showError(
            "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง " +
              'หรือส่งรายละเอียดมาที่ <a href="mailto:2provi@gmail.com">2provi@gmail.com</a>'
          );
          submitButton.disabled = false;
          submitButton.textContent = "ส่งใบสมัคร →";
        }
      });
    })();
