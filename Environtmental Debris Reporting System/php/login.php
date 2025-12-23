<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../db.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($username === '' || $password === '') {
        $error = 'Please fill username and password.';
    } else {
        $stmt = $conn->prepare("SELECT id, username, password, role FROM users WHERE username = ?");
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $res = $stmt->get_result();
        $user = $res->fetch_assoc();

        if ($user && $user['password'] === md5($password)) {
            $_SESSION['user'] = [
                'id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role']
            ];

            // Regenerate session id and explicitly set session cookie for root path
            session_regenerate_id(true);
            setcookie(session_name(), session_id(), [
                'path' => '/',
                'httponly' => true,
                'samesite' => 'Lax'
            ]);

            error_log('[login] user logged in: ' . $user['username'] . ' session_id=' . session_id());

            if ($user['role'] === 'admin') {
                header('Location: admin.php');
            } else {
                header('Location: client.php');
            }
            exit;
        } else {
            $error = 'Invalid username or password.';
        }
    }
}

include __DIR__ . '/../html/login.html';
