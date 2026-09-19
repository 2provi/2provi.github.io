// วาง URL ที่ได้จากการ Deploy Google Apps Script แบบ Web App
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxcjeRsdclsY_iV-xSd2VyXe10eBBawiYAhX3PxmPBtVJfpI1mliu8bwPB9fPqSOI0f/exec";

    const form = document.getElementById("quoteForm");
    const submitButton = document.getElementById("submitButton");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const formData = {
        name: document.getElementById("name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        age: document.getElementById("age").value,
        plan: document.getElementById("plan").value,
        budget: document.getElementById("budget").value,
        message: document.getElementById("message").value.trim()
      };

      submitButton.disabled = true;
      submitButton.textContent = "กำลังส่งข้อมูล...";

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(formData)
        });

        // เปลี่ยนหน้าเมื่อส่งข้อมูลแล้ว
        window.location.href = "thank-you.html";

      } catch (error) {
        alert("ไม่สามารถส่งข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือทักเราใน LINE");

        submitButton.disabled = false;
        submitButton.textContent = "ส่งข้อมูลเพื่อรับข้อเสนอ →";
      }
    });
