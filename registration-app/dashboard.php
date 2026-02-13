<?php
session_start();
if (!isset($_SESSION["user_id"])) {
  header("Location: auth/login.php");
  exit;
}
?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Dashboard</title>
  <link rel="stylesheet" href="assets/style.css" />
</head>
<body>
  <div class="card">
    <h1>Dashboard</h1>
    <p class="sub">You are logged in ✅</p>

    <div class="msg ok">
      Welcome, <b><?php echo htmlspecialchars($_SESSION["full_name"]); ?></b>!
    </div>

    <a class="btn" href="auth/logout.php" style="display:block;text-align:center;">Logout</a>
  </div>
</body>
</html>
