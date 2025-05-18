<?php
// Database connection
try {
    // Connect to the SQLite database
    $db = new PDO('sqlite:main.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // SQL query to fetch the sum of amounts grouped by currency_pair
    $sql = "
    SELECT 
        currency_pair,
        SUM(CASE 
            WHEN is_win = 1 THEN amount -- Add amount if is_win is true
            ELSE -amount               -- Subtract amount if is_win is false
        END) AS total_amount
    FROM 
        trading
    WHERE 
        amount IS NOT NULL
    GROUP BY 
        currency_pair
    ORDER BY 
        total_amount DESC
";
    $stmt = $db->prepare($sql);
    $stmt->execute();

    // Fetch the results
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return the data as JSON
    echo json_encode($data);
} catch (PDOException $e) {
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
} finally {
    // Close the database connection
    if (isset($db)) {
        $db = null; // Explicitly closing the connection
    }
}
