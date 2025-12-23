<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../includes/auth.php';

require_role('admin');

include __DIR__ . '/../html/admin.html';
