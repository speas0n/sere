<?php
function getTotalBalance()
{
    $dbFile = 'main.db';
    $connection = new PDO("sqlite:$dbFile");
    $connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    try {
        // SQL query to get the current_amount for the account with the maximum id
        $sql = "SELECT current_amount FROM account WHERE id = (SELECT MAX(id) FROM account)";

        $stmt = $connection->prepare($sql);
        $stmt->execute();

        // Fetch and return the result
        return $stmt->fetchColumn(); // fetchColumn() retrieves a single value from the result set
    } catch (PDOException $e) {
        echo "Query failed: " . $e->getMessage();
        return null;
    } finally {
        // Close the database connection
        if (isset($connection)) {
            $connection = null;
        }
    }
}

// Output total balance as JSON for AJAX
header('Content-Type: application/json');
echo json_encode(['total_balance' => getTotalBalance()]);
