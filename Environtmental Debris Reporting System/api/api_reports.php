<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

// Require authenticated client for normal operation
require_role('client');

$clientName = $_SESSION['user']['username'] ?? 'Unknown User';
error_log('[api_reports] invoked by ' . $clientName . ' at ' . date('c'));

// Debug mode: GET ?debug=1 will return diagnostic info about upload, POST, FILES, session and dir
if (isset($_GET['debug']) && $_GET['debug'] == '1') {
    $uploadDir = __DIR__ . '/uploads/';
    $diagnostic = [
        'method' => $_SERVER['REQUEST_METHOD'],
        'client' => $clientName,
        'session_user' => $_SESSION['user'] ?? null,
        'post_keys' => array_keys($_POST),
        'files' => array_map(function($f){ return [ 'name'=>$f['name'] ?? null,'size'=>$f['size'] ?? null,'error'=>$f['error'] ?? null,'tmp_name'=> $f['tmp_name'] ?? null]; }, $_FILES),
        'upload_dir_exists' => is_dir($uploadDir),
        'upload_dir_writable' => is_writable($uploadDir),
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'php_version' => phpversion(),
    ];
    echo json_encode(['debug' => $diagnostic]);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }

    // REQUIRED FIELDS
    $required = ["wasteType", "locationType", "severity", "latitude", "longitude", "notes"];
    foreach ($required as $f) {
        if (!isset($_POST[$f]) || trim($_POST[$f]) === '') {
            http_response_code(400);
            throw new Exception("Missing: $f");
        }
    }

    // PHOTO CHECK
    if (!isset($_FILES["photo"]) || $_FILES["photo"]["error"] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        throw new Exception('Photo missing or upload error (code: ' . ($_FILES['photo']['error'] ?? 'N/A') . ')');
    }

    // UPLOAD FOLDER (store only filename in DB)
    $uploadDir = __DIR__ . '/uploads/';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0777, true)) {
        throw new Exception('Failed to create upload directory: ' . $uploadDir);
    }

    // Ensure directory is writable
    if (!is_writable($uploadDir)) {
        @chmod($uploadDir, 0777);
        if (!is_writable($uploadDir)) {
            throw new Exception('Upload directory is not writable by PHP: ' . $uploadDir . '. On Windows, grant the Apache user (or Users) write permission.');
        }
    }

    // Check file size against PHP limits
    $size = $_FILES['photo']['size'] ?? 0;
    $maxUpload = ini_get('upload_max_filesize');
    $maxPost = ini_get('post_max_size');
    $toBytes = function($val) {
        $val = trim($val);
        $last = strtolower($val[strlen($val)-1]);
        $num = (int)$val;
        switch($last) {
            case 'g': $num *= 1024;
            case 'm': $num *= 1024;
            case 'k': $num *= 1024;
            case 'l': $num *= 1024;
            case 'r': $num *= 1024;
        }
        return $num;
    };
    if ($size > $toBytes($maxUpload) || $size > $toBytes($maxPost)) {
        throw new Exception('Uploaded file exceeds PHP limits (upload_max_filesize=' . $maxUpload . ', post_max_size=' . $maxPost . ').');
    }

    // SAVE FILE (sanitize filename)
    $originalName = basename($_FILES["photo"]["name"]);
    $originalName = preg_replace('/[^A-Za-z0-9_.-]/', '_', $originalName);
    $fileName = time() . "_" . $originalName;
    $dest = $uploadDir . $fileName;

    // Ensure it's an image
    $imgInfo = @getimagesize($_FILES['photo']['tmp_name']);
    if ($imgInfo === false) {
        throw new Exception('Uploaded file is not a valid image.');
    }

    if (!is_uploaded_file($_FILES['photo']['tmp_name'])) {
        throw new Exception('Upload temp file missing');
    }
    if (!move_uploaded_file($_FILES["photo"]["tmp_name"], $dest)) {
        error_log('[api_reports] move_uploaded_file failed. tmp=' . ($_FILES['photo']['tmp_name'] ?? '') . ' dest=' . $dest);
        http_response_code(500);
        throw new Exception('Failed to move uploaded file to ' . $dest . '. Check folder permissions.');
    }

    // Validate lat/lng
    $latitude = filter_var($_POST["latitude"], FILTER_VALIDATE_FLOAT);
    $longitude = filter_var($_POST["longitude"], FILTER_VALIDATE_FLOAT);
    if ($latitude === false || $longitude === false) {
        http_response_code(400);
        throw new Exception('Invalid latitude/longitude');
    }

    // sanitize other fields
    $wasteType = $conn->real_escape_string($_POST["wasteType"]);
    $locationType = $conn->real_escape_string($_POST["locationType"]);
    $severity = $conn->real_escape_string($_POST["severity"]);
    $notes = $conn->real_escape_string($_POST["notes"]);

    // INSERT using prepared statement
    $stmt = $conn->prepare("INSERT INTO reports (photo, wasteType, locationType, severity, latitude, longitude, notes, reportedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    if ($stmt === false) throw new Exception('Prepare failed: ' . $conn->error);
    $stmt->bind_param('ssssddss', $fileName, $wasteType, $locationType, $severity, $latitude, $longitude, $notes, $clientName);
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Report submitted successfully!",
            "reportedBy" => $clientName
        ]);
    } else {
        http_response_code(500);
        throw new Exception('DB insert failed: ' . $stmt->error);
    }
    $stmt->close();
} catch (Exception $e) {
    error_log('[api_reports] Error: ' . $e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}
?>
