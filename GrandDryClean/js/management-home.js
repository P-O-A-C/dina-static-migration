(function () {
  "use strict";

  const avatar = document.getElementById("gmAvatar");
  const input = document.getElementById("gmAvatarInput");
  const button = document.getElementById("gmAvatarBtn");
  const message = document.getElementById("gmPhotoMsg");
  let initialized = false;

  function setMessage(text, isError = false) {
    if (!message) return;
    message.textContent = text || "";
    message.classList.toggle("is-error", Boolean(isError));
  }

  function showAvatar(source) {
    if (!avatar) return;
    if (!source || !/^(https?:\/\/|data:image\/)/i.test(String(source))) return;
    const image = document.createElement("img");
    image.alt = "الصورة الشخصية لحساب المغسلة";
    image.referrerPolicy = "no-referrer";
    image.src = source;
    image.onerror = () => image.remove();
    avatar.replaceChildren(image);
  }

  function readCompressedImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !String(file.type || "").startsWith("image/")) {
        reject(new Error("اختر ملف صورة صالحًا."));
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        reject(new Error("حجم الصورة يجب ألا يتجاوز 20 ميجابايت."));
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        try {
          const maxDimension = 512;
          const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext("2d");
          if (!context) throw new Error("تعذر تجهيز الصورة في المتصفح.");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              reject(new Error("تعذر ضغط الصورة."));
              return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("تعذر قراءة الصورة بعد تجهيزها."));
            reader.readAsDataURL(blob);
          }, "image/jpeg", 0.78);
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("تعذر فتح الصورة المختارة."));
      };
      image.src = objectUrl;
    });
  }

  async function getCurrentUserId(client) {
    const result = await client.auth.getSession();
    if (result.error) throw result.error;
    const user = result.data && result.data.session && result.data.session.user;
    if (!user || !user.id) throw new Error("انتهت جلسة الدخول. سجّل الدخول مرة أخرى.");
    return user.id;
  }

  async function loadAvatar(client) {
    try {
      const uid = await getCurrentUserId(client);
      const result = await client.from("profiles").select("avatar_url").eq("id", uid).maybeSingle();
      if (result.error) throw result.error;
      if (result.data && result.data.avatar_url) showAvatar(result.data.avatar_url);
    } catch (error) {
      console.warn("GRAND DRY CLEAN avatar could not be loaded:", error?.message || error);
    }
  }

  async function handlePhotoChange(client) {
    const file = input && input.files && input.files[0];
    if (!file) return;
    if (button) {
      button.disabled = true;
      const label = button.querySelector("span");
      if (label) label.textContent = "جارٍ حفظ الصورة…";
    }
    setMessage("");
    try {
      const uid = await getCurrentUserId(client);
      const avatarUrl = await readCompressedImage(file);
      const result = await client.from("profiles").update({ avatar_url: avatarUrl }).eq("id", uid);
      if (result.error) throw result.error;
      showAvatar(avatarUrl);
      setMessage("تم تحديث الصورة الشخصية بنجاح.");
    } catch (error) {
      console.error("GRAND DRY CLEAN avatar update failed:", error);
      setMessage(error?.message || "تعذر تحديث الصورة. حاول مرة أخرى.", true);
    } finally {
      if (button) {
        button.disabled = false;
        const label = button.querySelector("span");
        if (label) label.textContent = "إضافة / تغيير الصورة";
      }
      if (input) input.value = "";
    }
  }

  async function initialize() {
    if (initialized) return;
    initialized = true;
    const client = window.__GDC_SUPABASE_CLIENT__;
    if (!client) {
      console.warn("GRAND DRY CLEAN profile controls are waiting for the authenticated session.");
      initialized = false;
      return;
    }
    if (button && input) {
      button.addEventListener("click", () => input.click());
      input.addEventListener("change", () => handlePhotoChange(client));
    }
    await loadAvatar(client);
  }

  window.addEventListener("granddryclean:authorized", initialize, { once: true });
  if (document.documentElement.dataset.grandDryCleanAuthorized === "true") initialize();
})();
