const API_URL = "http://localhost:5000/api/auth";

// ── SIGNUP ──
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const locationVal = document.getElementById("location").value.split(",");
    const city = locationVal[0].trim();
    const area = locationVal[1] ? locationVal[1].trim() : "";

    const data = {
      name:     document.getElementById("name").value,
      email:    document.getElementById("email").value,
      password: document.getElementById("password").value,
      blood:    document.getElementById("bloodGroup").value,
      city,
      area
    };

    try {
      const res    = await fetch(`${API_URL}/signup`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) return alert(result.msg);
      alert("✅ Signup successful! Please login.");
      window.location.href = "login.html";
    } catch (err) {
      alert("❌ Server error. Make sure backend is running.");
    }
  });
}

// ── LOGIN ──
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      email:    document.getElementById("email").value,
      password: document.getElementById("password").value
    };

    try {
      const res    = await fetch(`${API_URL}/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) return alert(result.msg);

      localStorage.setItem("token", result.token);
      localStorage.setItem("user",  JSON.stringify(result.user));
      localStorage.setItem("isAvailable", result.user.isAvailable !== false ? "true" : "false");

      window.location.href = "dashboard.html";
    } catch (err) {
      alert("❌ Server error. Make sure backend is running.");
    }
  });
}