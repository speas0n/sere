<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Connect to the SQLite database
        $db = new PDO('sqlite:main.db');
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Get the input data
        $accountName = $_POST['account_name'];
        $currentBalance = $_POST['current_balance'];
        $currentTime = date('Y-m-d H:i:s');
        $trade_id = 0;

        // Insert the new record
        $sql = "INSERT INTO account (trade_id, account_name, current_amount, date) VALUES (:trade_id, :account_name, :current_balance, :current_time)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(':trade_id', $trade_id);
        $stmt->bindParam(':account_name', $accountName);
        $stmt->bindParam(':current_balance', $currentBalance);
        $stmt->bindParam(':current_time', $currentTime);
        $stmt->execute();

        // Return success response
        echo json_encode(["status" => "success", "message" => "Balance updated successfully."]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    } finally {
        // Close the database connection
        if (isset($db)) {
            $db = null; // Explicitly closing the connection
        }
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
