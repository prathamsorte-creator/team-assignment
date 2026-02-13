// assets/app.js

const $ = (q) => document.querySelector(q);
const $$ = (q) => document.querySelectorAll(q);

function scorePassword(pw) {
  let score = 0;
  if (!pw) return 0;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNum = /[0-9]/.test(pw);
  const hasSym = /[^A-Za-z0-9]/.test(pw);

  score += Math.min(40, pw.length * 4);         // length
  score += hasLower ? 10 : 0;
  score += hasUpper ? 15 : 0;
  score += hasNum ? 15 : 0;
  score += hasSym ? 20 : 0;

  // penalize very common patterns
  if (/^(1234|12345|password|qwerty|admin)/i.test(pw)) score -= 25;
  return Math.max(0, Math.min(100, score));
}

function strengthLabel(score) {
  if (score < 35) return ["Weak", "warn"];
  if (score < 70) return ["Medium", "mid"];
  return ["Strong", "good"];
}

function setFieldState(input, ok, msg = "") {
  const wrap = input.closest(".field");
  if (!wrap) return;
  wrap.classList.remove("ok", "bad");
  wrap.classList.add(ok ? "ok" : "bad");
  const small = wrap.querySelector("small");
  if (small) small.textContent = msg;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  // simple: 10-15 digits allowed with +, spaces, hyphens
  return /^[+]?[\d\s-]{10,18}$/.test(phone.trim());
}

function liveRegisterValidation() {
  const name = $("#full_name");
  const email = $("#email");
  const phone = $("#phone");
  const pw = $("#password");
  const cpw = $("#confirm");
  const terms = $("#terms");

  if (name) {
    name.addEventListener("input", () => {
      const v = name.value.trim();
      setFieldState(name, v.length >= 3, v.length >= 3 ? "" : "Min 3 characters");
    });
  }

  if (email) {
    email.addEventListener("input", () => {
      const v = email.value.trim();
      setFieldState(email, validateEmail(v), validateEmail(v) ? "" : "Enter a valid email");
    });
  }

  if (phone) {
    phone.addEventListener("input", () => {
      const v = phone.value.trim();
      setFieldState(phone, validatePhone(v), validatePhone(v) ? "" : "Enter a valid phone (10-15 digits)");
    });
  }

  if (pw) {
    const bar = $("#pwBar");
    const tag = $("#pwTag");
    const toggle = $("#togglePw");

    const update = () => {
      const s = scorePassword(pw.value);
      if (bar) bar.style.width = s + "%";
      const [label, cls] = strengthLabel(s);
      if (tag) {
        tag.textContent = label;
        tag.className = "tag " + cls;
      }
      // rule hints
      const hint = [];
      if (pw.value.length < 8) hint.push("8+ chars");
      if (!/[A-Z]/.test(pw.value)) hint.push("1 uppercase");
      if (!/[0-9]/.test(pw.value)) hint.push("1 number");
      if (!/[^A-Za-z0-9]/.test(pw.value)) hint.push("1 symbol");
      setFieldState(pw, hint.length === 0, hint.length === 0 ? "" : "Add: " + hint.join(", "));
    };

    pw.addEventListener("input", update);
    update();

    if (toggle) {
      toggle.addEventListener("click", () => {
        pw.type = pw.type === "password" ? "text" : "password";
        toggle.textContent = pw.type === "password" ? "Show" : "Hide";
      });
    }
  }

  if (cpw && pw) {
    cpw.addEventListener("input", () => {
      const ok = cpw.value === pw.value && cpw.value.length > 0;
      setFieldState(cpw, ok, ok ? "" : "Passwords must match");
    });
  }

  if (terms) {
    terms.addEventListener("change", () => {
      setFieldState(terms, terms.checked, terms.checked ? "" : "You must accept terms");
    });
  }

  // avatar preview
  const avatar = $("#avatar");
  const preview = $("#avatarPreview");
  if (avatar && preview) {
    avatar.addEventListener("change", () => {
      const f = avatar.files && avatar.files[0];
      if (!f) return;
      const ok = ["image/png", "image/jpeg", "image/webp"].includes(f.type) && f.size <= 2 * 1024 * 1024;
      if (!ok) {
        alert("Avatar must be PNG/JPG/WEBP and <= 2MB");
        avatar.value = "";
        preview.src = "";
        return;
      }
      preview.src = URL.createObjectURL(f);
    });
  }
}

document.addEventListener("DOMContentLoaded", liveRegisterValidation);
