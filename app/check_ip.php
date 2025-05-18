<?php
$config = include('config.php');

$access_password = $config['ACCESS_PASSWORD'];
$token = $config['TOKEN'];

if (!isset($_COOKIE['device_token'])) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input_password = $_POST['password'] ?? '';

        if ($input_password === $access_password) {
            setcookie('device_token', $token, time() + (86400 * 30), '/');
            header('Location: ' . $_SERVER['PHP_SELF']); 
            exit();
        } else {
            header('Location: error.php');
            exit();
        }
    }

    // If no cookie and no POST data, show the password form
    echo '<form method="POST" action="">
            <label for="password">Enter Access Password:</label>
            <input type="password" id="password" name="password" required>
            <button type="submit">Submit</button>
          </form>';
    exit();
}

?>