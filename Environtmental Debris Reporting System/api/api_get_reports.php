<?php
require_once __DIR__ . '/../db.php';
header('Content-Type: application/json; charset=utf-8');

$sql = "SELECT id, wasteType, locationType, severity, latitude, longitude, notes, photo, cleaned, timestamp, cleanedDate FROM reports ORDER BY id DESC";
$res = $conn->query($sql);

if ($res === false) {
    http_response_code(500);
    echo json_encode(['error' => 'DB query failed', 'detail' => $conn->error]);
    exit;
}

$rows = [];
while ($r = $res->fetch_assoc()) {
    // Format the dates nicely
    $r['dateAdded'] = isset($r['timestamp']) ? date("F d, Y h:i A", strtotime($r['timestamp'])) : "";
    $r['cleanedDateFormatted'] = !empty($r['cleanedDate']) ? date("F d, Y h:i A", strtotime($r['cleanedDate'])) : "Not cleaned";

    // Normalize photo field:
    if (empty($r['photo'])) {
        // small inline SVG placeholder
        $svg = rawurlencode('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#aaa" font-size="14">No Image</text></svg>');
        $r['photo'] = 'data:image/svg+xml;utf8,' . $svg;
    } else {
        $photo = $r['photo'];
        // If it already looks like a URL/data or contains a path, respect it
        if (preg_match('#^https?://#i', $photo) || strpos($photo, 'data:') === 0) {
            // leave as is
        } elseif (strpos($photo, '/') !== false) {
            // may be 'uploads/filename' — make web path relative to html
            if (strpos($photo, 'uploads/') === 0) {
                $r['photo'] = '../api/' . $photo;
            } else {
                $r['photo'] = '../api/' . $photo;
            }
        } else {
            // filename only
            $r['photo'] = '../api/uploads/' . $photo;
        }
    }

    $rows[] = $r;
}

if (isset($_GET['debug'])) {
    echo json_encode(['count' => count($rows), 'rows' => $rows]);
} else {
    echo json_encode($rows);
}
