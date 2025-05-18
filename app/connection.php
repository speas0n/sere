<?php
/**
 * Establishes a connection to the SQLite database.
 *
 * @return PDO|null Returns a PDO instance on success, or null on failure.
 */
function getConnection() {
    $dbFile = 'main.db'; // Path to your SQLite database file

    try {
        $connection = new PDO("sqlite:$dbFile");
        $connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $connection->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $connection;
    } catch (PDOException $e) {
        echo "Connection failed: " . $e->getMessage();
        return null;
    }
}
