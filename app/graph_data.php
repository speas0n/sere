<?php
// Database connection
try {
    // Connect to the SQLite database
    $db = new PDO('sqlite:main.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // SQL query to fetch data from account table where date is not null
    $sql = "SELECT * FROM account ORDER BY date";
    $stmt = $db->prepare($sql);
    $stmt->execute();

    // Fetch the results
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return the data as JSON
    echo json_encode($data);
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage();
} finally {
    // Close the database connection
    if (isset($db)) {
        $db = null; // Explicitly closing the connection
    }
}
