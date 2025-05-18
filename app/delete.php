<?php
// Check if the id is provided via POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
    $db = new PDO('sqlite:main.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $id = intval($_POST['id']); // Sanitize input to prevent SQL injection

    try {
        // Begin transaction
        $db->beginTransaction();

        // Step 1: Delete from account table where trade_id matches the id
        $deleteAccountSql = "DELETE FROM account WHERE trade_id = :id";
        $accountStmt = $db->prepare($deleteAccountSql);
        $accountStmt->bindParam(':id', $id, PDO::PARAM_INT);
        if (!$accountStmt->execute()) {
            throw new Exception("Failed to delete from account table.");
        }

        // Step 2: Delete from trading table where id matches
        $deleteTradingSql = "DELETE FROM trading WHERE id = :id";
        $tradingStmt = $db->prepare($deleteTradingSql);
        $tradingStmt->bindParam(':id', $id, PDO::PARAM_INT);
        if (!$tradingStmt->execute()) {
            throw new Exception("Failed to delete from trading table.");
        }

        // Commit transaction
        $db->commit();

        echo json_encode(["status" => "success", "message" => "Records deleted successfully"]);
    } catch (Exception $e) {
        // Rollback transaction if an error occurs
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request"]);
}
?>