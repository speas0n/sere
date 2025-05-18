<?php
header("Content-Type: application/json");

// Path to your SQLite database file
$dbFile = 'main.db';

// Validate the input
if (!isset($_GET['trade_id']) || !is_numeric($_GET['trade_id'])) {
    echo json_encode(['error' => 'Invalid or missing trade ID']);
    exit;
}

$trade_id = intval($_GET['trade_id']);

try {
    // Connect to the SQLite database
    $connection = new PDO("sqlite:$dbFile");
    $connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Prepare and execute the query
    $sql = "SELECT * FROM trading WHERE id = :trade_id LIMIT 1";
    $stmt = $connection->prepare($sql);
    $stmt->bindParam(':trade_id', $trade_id, PDO::PARAM_INT);
    $stmt->execute();

    $tradeDetail = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($tradeDetail) {
        echo json_encode($tradeDetail);
    } else {
        echo json_encode(['error' => 'Trade not found']);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database query failed: ' . $e->getMessage()]);
} finally {
    // Close the database connection
    if (isset($connection)) {
        $connection = null;
    }
}
