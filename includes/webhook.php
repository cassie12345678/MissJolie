<?php
/* ============================================================
   MOLLIE WEBHOOK - VERWERK BETALINGEN
   Updated met database integratie
============================================================ */

$apiKey = "live_KT2n6pBqcEwWjUdbEc9dEGxnxK26KB";

function columnExists(PDO $pdo, string $tableName, string $columnName): bool {
    try {
        $stmt = $pdo->prepare("SHOW COLUMNS FROM `{$tableName}` LIKE ?");
        $stmt->execute([$columnName]);
        return (bool) $stmt->fetchColumn();
    } catch (Throwable $e) {
        return false;
    }
}

// Hoogt usedCount van een kortingscode met 1 op in discount-codes.json.
// Gebruikt flock() om gelijktijdige schrijfacties (meerdere betalingen tegelijk) veilig te maken.
function incrementDiscountCodeUsage(string $code): void {
    $file = __DIR__ . '/discount-codes.json';
    $handle = @fopen($file, 'c+');
    if (!$handle) {
        return;
    }

    if (flock($handle, LOCK_EX)) {
        $contents = stream_get_contents($handle);
        $data = json_decode($contents, true);
        $codes = $data['codes'] ?? [];

        foreach ($codes as &$c) {
            if (isset($c['code']) && strcasecmp($c['code'], $code) === 0) {
                $c['usedCount'] = (int) ($c['usedCount'] ?? 0) + 1;
                break;
            }
        }
        unset($c);

        $data['codes'] = $codes;

        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        fflush($handle);
        flock($handle, LOCK_UN);
    }

    fclose($handle);
}

$paymentId = $_POST["id"] ?? null;

if (empty($paymentId)) {
    file_put_contents("mollie-log.txt",
        date("Y-m-d H:i:s") . " | Webhook ERROR: missing payment id\n",
        FILE_APPEND
    );
    http_response_code(200);
    exit;
}

// Haal betaling op
$ch = curl_init("https://api.mollie.com/v2/payments/" . $paymentId);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $apiKey,
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$payment = json_decode($response, true);

$paymentStatus = strtolower($payment["status"] ?? '');

if ($paymentStatus === 'paid') {
    // Haal metadata op (dit moet je in je checkout meegeven)
    $metadata = isset($payment["metadata"]) ? $payment["metadata"] : [];

    if (!empty($metadata["items"])) {
        require_once 'db-config.php';

        try {
            // Controleer of deze betaling al is verwerkt (deduplicatie)
            try {
                $dupCheck = $pdo->prepare("SELECT id FROM purchases WHERE payment_id = ? LIMIT 1");
                $dupCheck->execute([$paymentId]);
                if ($dupCheck->fetch()) {
                    file_put_contents("mollie-log.txt",
                        date("Y-m-d H:i:s") . " | Payment $paymentId | SKIPPED: already processed\n",
                        FILE_APPEND
                    );
                    http_response_code(200);
                    exit;
                }
            } catch (Throwable $e) {
                // payment_id kolom bestaat mogelijk niet, ga door
            }

            $userId = !empty($metadata["user_id"]) ? intval($metadata["user_id"]) : 0;
            $hasBookingPaymentStatus = columnExists($pdo, 'bookings', 'payment_status');

            $rawItems = $metadata["items"] ?? [];
            $items = is_string($rawItems) ? json_decode($rawItems, true) : (is_array($rawItems) ? $rawItems : []);

            $rawBookingInfo = $metadata["booking_info"] ?? null;
            $bookingInfo = is_string($rawBookingInfo) ? json_decode($rawBookingInfo, true) : (is_array($rawBookingInfo) ? $rawBookingInfo : null);

            $rawCustomerData = $metadata["customer_data"] ?? null;
            $customerData = is_string($rawCustomerData) ? json_decode($rawCustomerData, true) : (is_array($rawCustomerData) ? $rawCustomerData : null);

            $discountCode = !empty($metadata["discount_code"]) ? $metadata["discount_code"] : null;
            $discountAmount = isset($metadata["discount_amount"]) ? floatval($metadata["discount_amount"]) : 0;

            if (!is_array($items)) {
                $items = [];
            }

            if ($userId <= 0 && !empty($customerData["email"])) {
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
                $stmt->execute([$customerData["email"]]);
                $matchedUser = $stmt->fetch();
                if ($matchedUser) {
                    $userId = intval($matchedUser['id']);
                }
            }

            if ($userId <= 0 || empty($items)) {
                file_put_contents("mollie-log.txt",
                    date("Y-m-d H:i:s") . " | Payment $paymentId | SKIPPED: missing user_id or items\n",
                    FILE_APPEND
                );
                http_response_code(200);
                exit;
            }
            
            foreach ($items as $item) {
                if (!is_array($item)) {
                    continue;
                }

                $itemType = $item["type"] ?? null;
                $itemId = $item["id"] ?? null;
                $itemName = $item["name"] ?? 'Onbekend item';
                $itemPrice = isset($item["price"]) ? floatval($item["price"]) : 0;

                $itemTier = $item["tier"] ?? null;
                $itemDescription = $item["description"] ?? null;
                if (!empty($itemTier)) {
                    $itemName .= " - " . $itemTier;
                }
                if (!empty($itemDescription) && stripos($itemName, $itemDescription) === false) {
                    $itemName .= " - " . $itemDescription;
                }

                if (empty($itemId) && !empty($itemName)) {
                    $itemId = $itemName;
                }

                if (empty($itemType) || empty($itemId)) {
                    continue;
                }

                // Sla purchase op (schema-robuust)
                $inserted = false;

                try {
                    $stmt = $pdo->prepare("
                        INSERT INTO purchases (user_id, purchase_type, item_id, item_name, price, payment_id, payment_status, discount_code, discount_amount)
                        VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, ?)
                    ");
                    $stmt->execute([
                        $userId,
                        $itemType,
                        $itemId,
                        $itemName,
                        $itemPrice,
                        $paymentId,
                        $discountCode,
                        $discountAmount
                    ]);
                    $inserted = true;
                } catch (Throwable $e) {
                    // discount_code/discount_amount kolommen bestaan mogelijk nog niet, val terug.
                }

                if (!$inserted) {
                    try {
                        $stmt = $pdo->prepare("
                            INSERT INTO purchases (user_id, purchase_type, item_id, item_name, price, payment_id, payment_status)
                            VALUES (?, ?, ?, ?, ?, ?, 'paid')
                        ");
                        $stmt->execute([
                            $userId,
                            $itemType,
                            $itemId,
                            $itemName,
                            $itemPrice,
                            $paymentId
                        ]);
                        $inserted = true;
                    } catch (Throwable $e) {
                        // Fallback below.
                    }
                }

                if (!$inserted) {
                    try {
                        $stmt = $pdo->prepare(" 
                            INSERT INTO purchases (user_id, purchase_type, item_id, item_name, price, payment_id) 
                            VALUES (?, ?, ?, ?, ?, ?)
                        ");
                        $stmt->execute([
                            $userId,
                            $itemType,
                            $itemId,
                            $itemName,
                            $itemPrice,
                            $paymentId
                        ]);
                        $inserted = true;
                    } catch (Throwable $e) {
                        // Continue fallback chain.
                    }
                }

                if (!$inserted) {
                    try {
                        $stmt = $pdo->prepare(" 
                            INSERT INTO purchases (user_id, purchase_type, item_id, item_name, price, payment_status) 
                            VALUES (?, ?, ?, ?, ?, 'paid')
                        ");
                        $stmt->execute([
                            $userId,
                            $itemType,
                            $itemId,
                            $itemName,
                            $itemPrice
                        ]);
                        $inserted = true;
                    } catch (Throwable $e) {
                        // Continue fallback chain.
                    }
                }

                if (!$inserted) {
                    $stmt = $pdo->prepare(" 
                        INSERT INTO purchases (user_id, purchase_type, item_id, item_name, price) 
                        VALUES (?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $userId,
                        $itemType,
                        $itemId,
                        $itemName,
                        $itemPrice
                    ]);
                }

                // Force paid status when column exists but wasn't used in insert.
                try {
                    $lastId = intval($pdo->lastInsertId());
                    if ($lastId > 0) {
                        $upd = $pdo->prepare("UPDATE purchases SET payment_status = 'paid' WHERE id = ?");
                        $upd->execute([$lastId]);
                    }
                } catch (Throwable $e) {
                    // Ignore for schemas without payment_status.
                }
                
                // Verstuur notificatie naar Miss Jolie voor ALLE aankopen
                try {
                    require_once 'email-template.php';
                    
                    $itemTypeLabel = ucfirst($itemType);
                    $customerName = $customerData["name"] ?? 'Onbekend';
                    $customerEmail = $customerData["email"] ?? 'Niet opgegeven';
                    $snapchatUsername = $customerData["snapchatUsername"] ?? null;

                    $emailContentMissJolie = '
                        <p><strong>🆕 NIEUWE AANKOOP ONTVANGEN</strong></p>
                        <div class="divider"></div>
                        <p><strong>Type:</strong> ' . htmlspecialchars($itemTypeLabel) . '</p>
                        <p><strong>Klantnaam:</strong> ' . htmlspecialchars($customerName) . '</p>
                        <p><strong>E-mail:</strong> <a href="mailto:' . htmlspecialchars($customerEmail) . '" style="color: #d896ff;">' . htmlspecialchars($customerEmail) . '</a></p>'
                        . (!empty($snapchatUsername) ? '<p><strong>Snapchat gebruikersnaam:</strong> ' . htmlspecialchars($snapchatUsername) . '</p>' : '') . '
                        <div class="divider"></div>
                        <p><strong>Product Details:</strong></p>
                        <div style="background: rgba(216, 150, 255, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <p style="margin: 8px 0;"><strong>Product:</strong> ' . htmlspecialchars($itemName) . '</p>
                            <p style="margin: 8px 0;"><strong>Product ID:</strong> ' . htmlspecialchars($itemId) . '</p>
                            <p style="margin: 8px 0;"><strong>Prijs:</strong> €' . number_format($itemPrice, 2, ',', '.') . '</p>
                            <p style="margin: 8px 0;"><strong>Betaling ID:</strong> ' . htmlspecialchars($paymentId) . '</p>
                        </div>
                        <p style="margin-top: 30px;">Deze aankoop is automatisch door het systeem verwerkt.<br><strong style="color: #d896ff;">Succes!</strong></p>
                    ';
                    
                    sendHtmlEmail("info@miss-jolie.store", "🆕 Nieuwe Aankoop - " . htmlspecialchars($itemName), $emailContentMissJolie);
                } catch (Throwable $e) {
                    file_put_contents("mollie-log.txt", 
                        date("Y-m-d H:i:s") . " | Notification ERROR: " . $e->getMessage() . "\n", 
                        FILE_APPEND
                    );
                }
                
                // Als collection, voeg toe aan user_collections
                if ($itemType === "collection") {
                    $stmt = $pdo->prepare("
                        INSERT IGNORE INTO user_collections (user_id, collection_id) 
                        VALUES (?, ?)
                    ");
                    $stmt->execute([$userId, $itemId]);
                }
                
                // Als booking, sla op in bookings tabel en verstuur email
                if ($itemType === "booking" && !empty($item["date"]) && !empty($item["time"])) {
                    $customerName = $customerData["name"] ?? ($item["customerName"] ?? '');
                    $customerEmail = $customerData["email"] ?? ($item["customerEmail"] ?? '');
                    $customerPhone = $customerData["phone"] ?? ($item["customerPhone"] ?? '');
                    
                    if ($hasBookingPaymentStatus) {
                        $stmt = $pdo->prepare(" 
                            INSERT INTO bookings (
                                user_id, service, duration, price, booking_date, booking_time, 
                                customer_name, customer_email, customer_phone, notes, 
                                status, payment_id, payment_status
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, 'paid')
                        ");
                        $stmt->execute([
                            $userId,
                            $item["service"] ?? $item["name"],
                            $item["duration"] ?? '',
                            $itemPrice,
                            $item["date"],
                            $item["time"],
                            $customerName,
                            $customerEmail,
                            $customerPhone,
                            $item["notes"] ?? '',
                            $paymentId
                        ]);
                    } else {
                        $stmt = $pdo->prepare(" 
                            INSERT INTO bookings (
                                user_id, service, duration, price, booking_date, booking_time, 
                                customer_name, customer_email, customer_phone, notes, 
                                status, payment_id
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
                        ");
                        $stmt->execute([
                            $userId,
                            $item["service"] ?? $item["name"],
                            $item["duration"] ?? '',
                            $itemPrice,
                            $item["date"],
                            $item["time"],
                            $customerName,
                            $customerEmail,
                            $customerPhone,
                            $item["notes"] ?? '',
                            $paymentId
                        ]);
                    }
                    
                    // Verstuur bevestigingsmail naar klant
                    if (!empty($customerEmail)) {
                        try {
                            require_once 'email-template.php';
                            
                            $bookingDate = date('l j F Y', strtotime($item["date"]));
                            $bookingTime = substr($item["time"], 0, 5);
                            
                            $emailContent = '
                            <h2 style="color: #d896ff;">✅ Booking Bevestigd!</h2>
                            <p>Hallo ' . htmlspecialchars($customerName) . ',</p>
                            <p>Je boeking is succesvol bevestigd en betaald!</p>
                            
                            <div style="background: rgba(216, 150, 255, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                                <h3 style="color: #d896ff; margin-top: 0;">📅 Jouw Afspraak Details</h3>
                                <p style="margin: 8px 0;"><strong>Service:</strong> ' . htmlspecialchars($item["service"] ?? $item["name"]) . '</p>
                                <p style="margin: 8px 0;"><strong>Duur:</strong> ' . htmlspecialchars($item["duration"] ?? '') . '</p>
                                <p style="margin: 8px 0;"><strong>Datum:</strong> ' . $bookingDate . '</p>
                                <p style="margin: 8px 0;"><strong>Tijd:</strong> ' . $bookingTime . '</p>
                                <p style="margin: 8px 0;"><strong>Prijs:</strong> €' . number_format(floatval($item["price"]), 2, ',', '.') . '</p>
                            </div>
                            
                            <div class="divider"></div>
                            
                            <h3 style="color: #d896ff;">📱 Wat nu?</h3>
                            <p>Je ontvangt vóór de sessie een bericht met de exacte details over hoe we contact maken.</p>
                            <p>Zorg dat je op het afgesproken tijdstip beschikbaar bent!</p>
                            
                            <div class="divider"></div>
                            
                            <h3 style="color: #d896ff;">❓ Vragen?</h3>
                            <p>Heb je vragen over je booking? Stuur een email naar <a href="mailto:info@miss-jolie.store" style="color: #d896ff;">info@miss-jolie.store</a></p>
                            
                            <p style="margin-top: 30px;">Tot snel! 💋<br><strong style="color: #d896ff;">Miss Jolie</strong></p>
                        ';
                        
                        $emailSent = sendHtmlEmail($customerEmail, "Booking Bevestigd - Miss Jolie", $emailContent);
                        
                        file_put_contents("mollie-log.txt", 
                            date("Y-m-d H:i:s") . " | Booking #" . $pdo->lastInsertId() . " | Email to: $customerEmail | " . ($emailSent ? "SUCCESS" : "FAILED") . "\n", 
                            FILE_APPEND
                        );
                        
                        // Verstuur OOK notificatie naar Miss Jolie
                        $bookingDate = date('l j F Y', strtotime($item["date"]));
                        $bookingTime = substr($item["time"], 0, 5);
                        
                        $emailContentMissJolie = '
                            <p><strong>🆕 NIEUWE BOEKING ONTVANGEN</strong></p>
                            <div class="divider"></div>
                            <p><strong>Klantnaam:</strong> ' . htmlspecialchars($customerName) . '</p>
                            <p><strong>E-mail:</strong> <a href="mailto:' . htmlspecialchars($customerEmail) . '" style="color: #d896ff;">' . htmlspecialchars($customerEmail) . '</a></p>
                            <p><strong>Telefoon:</strong> ' . (htmlspecialchars($customerPhone) ?: "Niet opgegeven") . '</p>
                            <div class="divider"></div>
                            <p><strong>Boekingdetails:</strong></p>
                            <div style="background: rgba(216, 150, 255, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                                <p style="margin: 8px 0;"><strong>Service:</strong> ' . htmlspecialchars($item["service"] ?? $item["name"]) . '</p>
                                <p style="margin: 8px 0;"><strong>Duur:</strong> ' . htmlspecialchars($item["duration"] ?? '') . '</p>
                                <p style="margin: 8px 0;"><strong>Datum:</strong> ' . $bookingDate . '</p>
                                <p style="margin: 8px 0;"><strong>Tijd:</strong> ' . $bookingTime . '</p>
                                <p style="margin: 8px 0;"><strong>Prijs:</strong> €' . number_format(floatval($item["price"]), 2, ',', '.') . '</p>
                                <p style="margin: 8px 0;"><strong>Betaling ID:</strong> ' . htmlspecialchars($paymentId) . '</p>
                            </div>
                            <p style="margin-top: 30px;">Deze boeking is automatisch door het systeem verwerkt.<br><strong style="color: #d896ff;">Succes!</strong></p>
                        ';
                        
                        sendHtmlEmail("info@miss-jolie.store", "🆕 Nieuwe Boeking - " . $item["service"], $emailContentMissJolie);
                        
                        } catch (Exception $emailError) {
                            file_put_contents("mollie-log.txt", 
                                date("Y-m-d H:i:s") . " | Email ERROR: " . $emailError->getMessage() . "\n", 
                                FILE_APPEND
                            );
                        }
                    }
                }
            }

            if (!empty($discountCode)) {
                try {
                    incrementDiscountCodeUsage($discountCode);
                } catch (Throwable $e) {
                    file_put_contents("mollie-log.txt",
                        date("Y-m-d H:i:s") . " | Payment $paymentId | Discount usage update ERROR: " . $e->getMessage() . "\n",
                        FILE_APPEND
                    );
                }
            }

            if (!empty($customerData["email"])) {
                try {
                    require_once 'email-template.php';

                    $lines = '';
                    $totalPrice = 0;
                    foreach ($items as $item) {
                        if (!is_array($item)) {
                            continue;
                        }
                        $lineName = htmlspecialchars($item['name'] ?? 'Onbekend item');
                        if (!empty($item['tier'])) {
                            $lineName .= ' - ' . htmlspecialchars($item['tier']);
                        }
                        if (!empty($item['description']) && stripos($lineName, $item['description']) === false) {
                            $lineName .= ' - ' . htmlspecialchars($item['description']);
                        }
                        $linePrice = isset($item['price']) ? floatval($item['price']) : 0;
                        $totalPrice += $linePrice;
                        $lines .= '<p style="margin: 8px 0;"><strong>' . $lineName . '</strong> — €' . number_format($linePrice, 2, ',', '.') . '</p>';
                    }

                    $emailContent = '
                        <h2 style="color: #d896ff;">✅ Betaling Ontvangen</h2>
                        <p>Hallo ' . htmlspecialchars($customerData['name'] ?? 'lieve klant') . ',</p>
                        <p>Je betaling is succesvol ontvangen. Je bestelling is gekoppeld aan je account.</p>
                        <div style="background: rgba(216, 150, 255, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3 style="color: #d896ff; margin-top: 0;">🧾 Bestelling</h3>
                            ' . $lines . '
                            <div class="divider"></div>
                            <p style="margin: 8px 0;"><strong>Totaal:</strong> €' . number_format($totalPrice, 2, ',', '.') . '</p>
                            <p style="margin: 8px 0;"><strong>Betaling ID:</strong> ' . htmlspecialchars($paymentId) . '</p>
                        </div>
                        <p>Je kunt je aankoop direct terugvinden in je account.</p>
                    ';

                    sendHtmlEmail($customerData["email"], "Betaling ontvangen - Miss Jolie", $emailContent);
                    
                    // Verstuur ALSO summary email naar Miss Jolie
                    try {
                        $emailContentMissJolieSummary = '
                            <p><strong>🧾 OVERZICHT VOLLEDIGE BESTELLING</strong></p>
                            <div class="divider"></div>
                            <p><strong>Klant:</strong> ' . htmlspecialchars($customerData['name'] ?? 'Onbekend') . '</p>
                            <p><strong>E-mail:</strong> <a href="mailto:' . htmlspecialchars($customerData["email"]) . '" style="color: #d896ff;">' . htmlspecialchars($customerData["email"]) . '</a></p>
                            <p><strong>Betaling ID:</strong> ' . htmlspecialchars($paymentId) . '</p>
                            <div class="divider"></div>
                            <h3 style="color: #d896ff;">Items:</h3>
                            ' . $lines . '
                            <div class="divider"></div>
                            <p style="margin: 8px 0;"><strong>Totaalbedrag:</strong> €' . number_format($totalPrice, 2, ',', '.') . '</p>
                            <p style="margin-top: 20px;">Deze bestelling is automatisch verwerkt.</p>
                        ';
                        
                        sendHtmlEmail("info@miss-jolie.store", "📦 Bestelingsoverzicht - " . htmlspecialchars($customerData['name'] ?? 'Klant'), $emailContentMissJolieSummary);
                    } catch (Throwable $e) {
                        file_put_contents("mollie-log.txt",
                            date("Y-m-d H:i:s") . " | Payment $paymentId | Summary notification ERROR: " . $e->getMessage() . "\n",
                            FILE_APPEND
                        );
                    }
                } catch (Throwable $emailError) {
                    file_put_contents("mollie-log.txt",
                        date("Y-m-d H:i:s") . " | Payment $paymentId | Order email ERROR: " . $emailError->getMessage() . "\n",
                        FILE_APPEND
                    );
                }
            }
            
            file_put_contents("mollie-log.txt", 
                date("Y-m-d H:i:s") . " | Payment $paymentId | User $userId | Status: paid | Items saved to DB\n", 
                FILE_APPEND
            );
            
        } catch (Throwable $e) {
            file_put_contents("mollie-log.txt", 
                date("Y-m-d H:i:s") . " | Payment $paymentId | ERROR: " . $e->getMessage() . "\n", 
                FILE_APPEND
            );
        }
    }
}

file_put_contents("mollie-log.txt", 
    date("Y-m-d H:i:s") . " | Payment $paymentId | Status: " . ($payment["status"] ?? 'unknown') . "\n", 
    FILE_APPEND
);

// Mollie verwacht lege 200 OK response
http_response_code(200);
