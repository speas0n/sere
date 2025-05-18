<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Database connection
    $db = new PDO('sqlite:main.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check for POST data
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Begin transaction
        $db->beginTransaction();

        // Insert into trading table
        $stmt = $db->prepare("
            INSERT INTO trading (currency_pair, risk, is_win, description, date, amount, uid)
            VALUES (:currency_pair, :risk, :is_win, :description, :date, :amount, :uid)
        ");
        $stmt->bindValue(':currency_pair', $_POST['currency_pair']);
        $stmt->bindValue(':risk', $_POST['risk']);
        $stmt->bindValue(':is_win', $_POST['is_win']);
        $stmt->bindValue(':description', $_POST['description']);
        $stmt->bindValue(':date', $_POST['date']);
        $stmt->bindValue(':amount', $_POST['amount']);
        $stmt->bindValue(':uid', $_POST['uid']);

        if (!$stmt->execute()) {
            throw new Exception("Failed to insert trade data.");
        }

        // Get the last inserted trade_id
        $tradeId = $db->lastInsertId();

        // Get the latest account data
        $accountStmt = $db->query("SELECT id, current_amount, account_name FROM account ORDER BY id DESC LIMIT 1");
        $latestAccount = $accountStmt->fetch(PDO::FETCH_ASSOC);

        if ($latestAccount) {
            $newAmount = $_POST['is_win'] === 'true'
                ? $latestAccount['current_amount'] + $_POST['amount']
                : $latestAccount['current_amount'] - $_POST['amount'];

            // If account_name is not available, assign a default value like "oanda"
            $accountName = !empty($latestAccount['account_name']) ? $latestAccount['account_name'] : 'oanda';

            // Insert into account table with trade_id
            $insertAccountStmt = $db->prepare("
                INSERT INTO account (current_amount, account_name, date, trade_id)
                VALUES (:current_amount, :account_name, :date, :trade_id)
            ");
            $insertAccountStmt->bindValue(':current_amount', $newAmount);
            $insertAccountStmt->bindValue(':account_name', $accountName);
            $insertAccountStmt->bindValue(':date', $_POST['date']);
            $insertAccountStmt->bindValue(':trade_id', $tradeId);

            if (!$insertAccountStmt->execute()) {
                throw new Exception("Failed to update account.");
            }
        } else {
            throw new Exception("No account data found.");
        }

        // Commit transaction
        $db->commit();

        // Send success response
        echo json_encode(['status' => 'success', 'message' => 'Trade and account updated successfully.']);
    } else {
        throw new Exception("Invalid request method.");
    }
} catch (Exception $e) {
    // Rollback transaction if an error occurs
    if ($db->inTransaction()) {
        $db->rollBack();
    }

    // Send error response
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    exit;
} finally {
    // Close the database connection
    if (isset($db)) {
        $db = null; // Explicitly closing the connection
    }
}