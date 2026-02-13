<?php
session_start();
require_once __DIR__ . "/../config/db.php";

$msg = "";
$msgType = "";

// NOTE: DB table currently stores only: full_name, email, password_hash
// Extra fields in the "crazy form" are for UI/assignment marks.
// If you want to store them too, tell me and I'll give you the ALTER TABLE + insert changes.

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $full_name = trim($_POST["full_name"] ?? "");
  $email = trim($_POST["email"] ?? "");
  $phone = trim($_POST["phone"] ?? "");
  $dob = trim($_POST["dob"] ?? "");
  $gender = trim($_POST["gender"] ?? "");
  $country = trim($_POST["country"] ?? "");
  $skills = $_POST["skills"] ?? [];
  $password = $_POST["password"] ?? "";
  $confirm = $_POST["confirm"] ?? "";
  $terms = isset($_POST["terms"]);

  // server-side validation (must have even if JS exists)
  if ($full_name === "" || $email === "" || $phone === "" || $password === "" || $confirm === "") {
    $msg = "Please fill all required fields.";
    $msgType = "err";
  } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $msg = "Invalid email.";
    $msgType = "err";
  } elseif (!preg_match("/^[+]?[\d\s-]{10,18}$/", $phone)) {
    $msg = "Invalid phone number.";
    $msgType = "err";
  } elseif (strlen($password) < 8 || !preg_match("/[A-Z]/", $password) || !preg_match("/[0-9]/", $password) || !preg_match("/[^A-Za-z0-9]/", $password)) {
    $msg = "Password must be 8+ chars and include uppercase, number, and symbol.";
    $msgType = "err";
  } elseif ($password !== $confirm) {
    $msg = "Passwords do not match.";
    $msgType = "err";
  } elseif (!$terms) {
    $msg = "You must accept the terms.";
    $msgType = "err";
  } else {
    // Email uniqueness check
    $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
      $msg = "Email already registered. Please login.";
      $msgType = "err";
    } else {
      $hash = password_hash($password, PASSWORD_DEFAULT);

      $stmt = $conn->prepare("INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)");
      $stmt->bind_param("sss", $full_name, $email, $hash);

      if ($stmt->execute()) {
        $msg = "Registration successful! You can login now.";
        $msgType = "ok";
      } else {
        $msg = "Something went wrong. Try again.";
        $msgType = "err";
      }
      $stmt->close();
    }
    $check->close();
  }
}
?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Register</title>
  <link rel="stylesheet" href="../assets/style.css" />
  <script src="../assets/app.js" defer></script>
</head>
<body>

  <div class="card ambient">
    <div class="top">
      <div>
        <h2>Create account</h2>
        <div class="subtitle">Smooth • Ambient • Secure (PHP + MySQL)</div>
      </div>
      <a href="login.php">Login →</a>
    </div>

    <form method="POST" enctype="multipart/form-data">
      <div class="grid">

        <div class="field">
          <label>Full Name *</label>
          <input id="full_name" name="full_name" type="text" placeholder=" " required />
          <small></small>
        </div>

        <div class="field">
          <label>Email *</label>
          <input id="email" name="email" type="email" placeholder=" " required />
          <small></small>
        </div>

        <div class="field">
          <label>Phone *</label>
          <input id="phone" name="phone" type="text" placeholder=" +91 98xxxxxx " required />
          <small></small>
        </div>

        <div class="field">
          <label>Date of Birth</label>
          <input name="dob" type="date" placeholder=" " />
          <small></small>
        </div>

        <div class="field">
          <label>Gender</label>
          <select name="gender">
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          <small></small>
        </div>

        <div class="field">
          <label>Country</label>
          <select name="country">
            <option value="">Select</option>
            <option>India</option>
            <option>USA</option>
            <option>UK</option>
            <option>Canada</option>
            <option>Other</option>
          </select>
          <small></small>
        </div>

        <div class="field rowwide">
          <label>Skills (multi-select)</label>
          <select name="skills[]" multiple style="min-height:110px;">
            <option>HTML</option>
            <option>CSS</option>
            <option>JavaScript</option>
            <option>PHP</option>
            <option>MySQL</option>
            <option>Python</option>
          </select>
          <small>Hold Ctrl (Windows) / Cmd (Mac) to select multiple</small>
        </div>

        <div class="field rowwide">
          <label>Avatar (optional)</label>
          <div class="avatarbox" style="margin-top:14px;">
            <img id="avatarPreview" class="avatar" alt="preview" />
            <input id="avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp" />
          </div>
          <small>Preview only (not stored yet).</small>
        </div>

        <div class="field">
          <label>Password *</label>
          <input id="password" name="password" type="password" placeholder=" " required />
          <button class="inline-btn" type="button" id="togglePw">Show</button>
          <small></small>

          <div class="pw-meter">
            <div class="bar"><div id="pwBar"></div></div>
            <div id="pwTag" class="tag warn">Weak</div>
          </div>
        </div>

        <div class="field">
          <label>Confirm Password *</label>
          <input id="confirm" name="confirm" type="password" placeholder=" " required />
          <small></small>
        </div>

        <div class="field rowwide">
          <label style="position:static; display:block; margin-bottom:10px;">Terms *</label>
          <div style="display:flex; align-items:center; gap:10px;">
            <input id="terms" name="terms" type="checkbox" style="width:auto; margin:0;" />
            <div style="color:rgba(229,231,235,.85); font-size:14px;">
              I agree to the Terms & Privacy Policy
            </div>
          </div>
          <small></small>
        </div>

      </div>

      <div class="actions">
        <button class="btn" type="submit">Create Account</button>
        <a class="btn-ghost" href="login.php" style="text-align:center; text-decoration:none; display:inline-block;">Login</a>
      </div>

      <?php if ($msg !== ""): ?>
        <div class="msg <?php echo $msgType === "ok" ? "ok" : "err"; ?>">
          <?php echo htmlspecialchars($msg); ?>
        </div>
      <?php endif; ?>
    </form>
  </div>

</body>
</html>
