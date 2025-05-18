<?php
function getTradesData()
{
    $dbFile = 'main.db';
    $connection = new PDO("sqlite:$dbFile");
    $connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    try {
        // Base SQL query
        $sql = "SELECT * FROM trading ORDER BY date";

        $stmt = $connection->prepare($sql);
        $stmt->execute();

        // Fetch and return results
        return $stmt->fetchAll(PDO::FETCH_ASSOC); // Use FETCH_ASSOC to return an associative array
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

// Output trades data as JSON for AJAX
header('Content-Type: application/json');
echo json_encode(getTradesData());
