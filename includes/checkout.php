<?php

header('Content-Type: application/json; charset=utf-8');

// Valideert een kortingscode server-side tegen discount-codes.json en berekent
// het kortingsbedrag zelf opnieuw — vertrouwt nooit een door de klant aangeleverd bedrag.
function validateDiscountCode($code, array $items) {
    $file = __DIR__ . '/discount-codes.json';
    if (!file_exists($file)) {
        return ['valid' => false, 'error' => 'Kortingscodes zijn niet beschikbaar.'];
    }

    $data = json_decode(file_get_contents($file), true);
    $codes = $data['codes'] ?? [];
    $match = null;
    foreach ($codes as $c) {
        if (isset($c['code']) && strcasecmp($c['code'], $code) === 0) {
            $match = $c;
            break;
        }
    }

    if (!$match || empty($match['active'])) {
        return ['valid' => false, 'error' => 'Deze kortingscode bestaat niet of is niet meer geldig.'];
    }
    if (!empty($match['expiryDate']) && strtotime($match['expiryDate']) < strtotime('today')) {
        return ['valid' => false, 'error' => 'Deze kortingscode is verlopen.'];
    }
    if (isset($match['maxUses']) && $match['maxUses'] !== null && ($match['usedCount'] ?? 0) >= $match['maxUses']) {
        return ['valid' => false, 'error' => 'Deze kortingscode is al te vaak gebruikt.'];
    }

    $categories = $match['categories'] ?? [];
    $products = $match['products'] ?? [];
    $subtotal = 0;
    $applicableSubtotal = 0;

    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }
        $price = isset($item['price']) ? floatval($item['price']) : 0;
        $subtotal += $price;

        $applies = in_array('all', $categories, true)
            || (isset($item['type']) && in_array($item['type'], $categories, true))
            || (isset($item['id']) && in_array($item['id'], $products, true));

        if ($applies) {
            $applicableSubtotal += $price;
        }
    }

    if (!empty($match['minAmount']) && $subtotal < floatval($match['minAmount'])) {
        return ['valid' => false, 'error' => 'Deze kortingscode is pas geldig vanaf €' . number_format($match['minAmount'], 2, ',', '.') . '.'];
    }
    if ($applicableSubtotal <= 0) {
        return ['valid' => false, 'error' => 'Deze kortingscode is niet van toepassing op je winkelmandje.'];
    }

    $discountAmount = $match['type'] === 'percentage'
        ? $applicableSubtotal * (floatval($match['value']) / 100)
        : min(floatval($match['value']), $applicableSubtotal);

    return [
        'valid' => true,
        'code' => $match['code'],
        'discount' => round($discountAmount, 2),
        'subtotal' => round($subtotal, 2)
    ];
}

// MOLLIE API KEYS
$isTestMode = (isset($_SERVER['HTTP_HOST']) && (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false));
$apiKey = $isTestMode ? "test_YOUR_MOLLIE_TEST_KEY_HERE" : "live_KT2n6pBqcEwWjUdbEc9dEGxnxK26KB";

// Allow test mode override via POST data (for explicit sandbox testing)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Ontvang POST van jouw website
$data = json_decode(file_get_contents("php://input"), true);
$testMode = isset($data["testMode"]) && $data["testMode"] === true;
$amountValue = isset($data["amount"]) ? floatval($data["amount"]) : 0;

if ($amountValue <= 0) {
    http_response_code(400);
    echo json_encode([
        "paymentUrl" => null,
        "error" => "Ongeldig totaalbedrag. Controleer je winkelmandje en probeer opnieuw."
    ]);
    exit;
}

$amount = number_format($amountValue, 2, ".", "");
$userId = isset($data["user_id"]) ? intval($data["user_id"]) : null;
$sessionUserId = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;

if (empty($userId) && !empty($sessionUserId)) {
    $userId = $sessionUserId;
}

$items = $data["items"] ?? [];
$bookingInfo = $data["booking_info"] ?? null;
$customerData = $data["customer_data"] ?? null;
$testMode = $testMode && $isTestMode;

$customerDataArray = null;
if (is_array($customerData)) {
    $customerDataArray = $customerData;
} elseif (is_string($customerData)) {
    $decodedCustomerData = json_decode($customerData, true);
    if (is_array($decodedCustomerData)) {
        $customerDataArray = $decodedCustomerData;
    }
}

if (empty($userId) && !empty($customerDataArray["email"])) {
    try {
        require_once 'db-config.php';
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$customerDataArray["email"]]);
        $matchedUser = $stmt->fetch();
        if ($matchedUser) {
            $userId = intval($matchedUser["id"]);
        }
    } catch (Throwable $e) {
        // If lookup fails we continue; webhook will do a second lookup attempt.
    }
}

$itemsArray = [];
if (is_string($items)) {
    $decodedItems = json_decode($items, true);
    if (is_array($decodedItems)) {
        $itemsArray = $decodedItems;
    }
} elseif (is_array($items)) {
    $itemsArray = $items;
}

$discountCode = !empty($data["discount_code"]) ? trim((string) $data["discount_code"]) : null;
$discountResult = null;

if (!empty($discountCode)) {
    $discountResult = validateDiscountCode($discountCode, $itemsArray);
    if (!$discountResult['valid']) {
        http_response_code(400);
        echo json_encode([
            "paymentUrl" => null,
            "error" => $discountResult['error']
        ]);
        exit;
    }

    $expectedAmount = round($discountResult['subtotal'] - $discountResult['discount'], 2);
    if (abs($expectedAmount - $amountValue) > 0.01) {
        http_response_code(400);
        echo json_encode([
            "paymentUrl" => null,
            "error" => "Het totaalbedrag klopt niet met de toegepaste kortingscode. Ververs de pagina en probeer opnieuw."
        ]);
        exit;
    }
}

$containsOnlyTestItems = !empty($itemsArray) && count(array_filter($itemsArray, function ($item) {
    return !is_array($item) || (($item['type'] ?? '') !== 'test');
})) === 0;

if (!$containsOnlyTestItems) {
    $testMode = false;
}

if (!is_string($items)) {
    $items = json_encode($items);
}

if (!is_string($bookingInfo) && $bookingInfo !== null) {
    $bookingInfo = json_encode($bookingInfo);
}

if (!is_string($customerData) && $customerData !== null) {
    $customerData = json_encode($customerData);
}

// Determine Mollie endpoint based on test mode
$mollie_endpoint = "https://api.mollie.com/v2/payments";

// Get the appropriate domain for redirectUrl and webhookUrl
$forwardedProto = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '';
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (isset($_SERVER['SERVER_PORT']) && intval($_SERVER['SERVER_PORT']) === 443)
    || (stripos($forwardedProto, 'https') !== false);

if (!$isTestMode) {
    $isHttps = true;
}

$protocol = $isHttps ? "https://" : "http://";
$domain = $_SERVER['HTTP_HOST'];
$redirectUrl = $protocol . $domain . "/betaald.html";
$webhookUrl = $protocol . $domain . "/includes/webhook.php";

// Maak Mollie betaling met metadata
$ch = curl_init($mollie_endpoint);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $apiKey,
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POST, 1);

$paymentData = [
    "amount" => [
        "currency" => "EUR",
        "value" => $amount
    ],
    "description" => "Bestelling Miss Jolie" . ($testMode ? " [TEST]" : ""),
    "redirectUrl" => $redirectUrl,
    "webhookUrl" => $webhookUrl,
    "metadata" => [
        "user_id" => $userId,
        "items" => $items,
        "booking_info" => $bookingInfo,
        "customer_data" => $customerData,
        "testMode" => $testMode ? "true" : "false",
        "discount_code" => $discountResult ? $discountResult['code'] : null,
        "discount_amount" => $discountResult ? number_format($discountResult['discount'], 2, '.', '') : null
    ]
];

curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$curlError = curl_error($ch);
$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);

if ($response === false || !empty($curlError)) {
    http_response_code(500);
    echo json_encode([
        "paymentUrl" => null,
        "error" => "Technische fout tijdens betaling. Probeer het later opnieuw."
    ]);
    exit;
}

$paymentUrl = $result["_links"]["checkout"]["href"] ?? null;
$paymentId = $result["id"] ?? null;

if ($httpStatus >= 400 || empty($paymentUrl)) {
    http_response_code(500);
    echo json_encode([
        "paymentUrl" => null,
        "error" => $result["detail"] ?? "Betaling kon niet worden gestart. Controleer de betaalinstellingen."
    ]);
    exit;
}

// Stuur payment URL terug naar frontend
echo json_encode([
    "paymentUrl" => $paymentUrl,
    "paymentId" => $paymentId
]);

