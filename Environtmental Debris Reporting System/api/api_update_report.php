<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

require_role('admin');

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$id = intval($data['id']);
$wasteType = $conn->real_escape_string($data['wasteType'] ?? '');
$locationType = $conn->real_escape_string($data['locationType'] ?? '');
$severity = $conn->real_escape_string($data['severity'] ?? '');
$notes = $conn->real_escape_string($data['notes'] ?? '');
$cleaned = isset($data['cleaned']) ? intval($data['cleaned']) : 0;

// check current cleaned status
$check_stmt = $conn->prepare("SELECT cleaned FROM reports WHERE id = ?");
$check_stmt->bind_param('i', $id);
$check_stmt->execute();
$check_res = $check_stmt->get_result();
$check = $check_res->fetch_assoc();
$check_stmt->close();

$cleanedDateSQL = "";
if ($cleaned === 1 && $check && $check['cleaned'] == 0) {
    $cleanedDateSQL = ", cleanedDate = NOW()";
}

$sql = "UPDATE reports SET
    wasteType = ?,
    locationType = ?,
    severity = ?,
    notes = ?,
    cleaned = ?
    $cleanedDateSQL
    WHERE id = ?";

$stmt = $conn->prepare($sql);
if ($stmt === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Prepare failed: ' . $conn->error]);
    exit;
}
$stmt->bind_param('ssssii', $wasteType, $locationType, $severity, $notes, $cleaned, $id);
if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Report updated successfully']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Error updating report: ' . $stmt->error]);
}
$stmt->close();
