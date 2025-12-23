<?php
// auth.php
// Ensure consistent session cookie parameters across the app
// Set explicit lifetime (0 = until browser closes) but can be increased if needed
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
session_start();

// Add lightweight logging to help debug session persistence on page refresh
error_log('[auth] session_start: id=' . session_id() . ' PHPSESSID=' . ($_COOKIE['PHPSESSID'] ?? 'none') . ' user=' . ($_SESSION['user']['username'] ?? 'null'));

function _is_api_request() {
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    $xhr = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    return (strpos($uri, '/api/') !== false) || (strpos($accept, 'application/json') !== false) || $xhr;
}

function require_login() {
    if (!isset($_SESSION['user'])) {
        if (_is_api_request()) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        header('Location: /Environtmental Debris Reporting System/php/login.php');
        exit;
    }
}

function require_role($role) {
    if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== $role) {
        if (_is_api_request()) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
        header('Location: /Environtmental Debris Reporting System/php/login.php');
        exit;
    }
}
