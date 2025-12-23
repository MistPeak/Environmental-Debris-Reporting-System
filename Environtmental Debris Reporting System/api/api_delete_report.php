<?php
// api_delete_report.php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json; charset=utf-8');

require_role('admin');

try {
    $id = null;
    if (isset($_GET['id'])) $id = intval($_GET['id']);
    if (isset($_POST['id'])) $id = intval($_POST['id']);
    if (!$id) throw new Exception('Missing id');

    // get photo filename
    $stmt = $conn->prepare("SELECT photo FROM reports WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->bind_result($photo);
    $stmt->fetch();
    $stmt->close();

    // delete row
    $stmt = $conn->prepare("DELETE FROM reports WHERE id = ?");
    $stmt->bind_param('i', $id);
    if (!$stmt->execute()) throw new Exception('Delete failed: ' . $stmt->error);
    $stmt->close();

    // delete photo file if exists (photo stored as filename)
    if ($photo) {
        $path = __DIR__ . '/uploads/' . $photo;
        if (file_exists($path)) @unlink($path);
    }

    echo json_encode(['success' => true, 'message' => 'Report deleted.']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["error" => $e->getMessage()]);
}
