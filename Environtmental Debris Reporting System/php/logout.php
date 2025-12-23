<?php
session_start();
// Clear session and cookie
session_unset();
session_destroy();
setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => '/']);
header('Location: /Environtmental Debris Reporting System/php/login.php');
exit;
