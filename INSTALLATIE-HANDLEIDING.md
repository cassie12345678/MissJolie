# 🔐 MISS JOLIE - INLOG SYSTEEM INSTALLATIE HANDLEIDING

## 📋 Overzicht
Een compleet authenticatie systeem met:
- ✅ Email & wachtwoord login/registratie
- ✅ Wachtwoord vergeten functionaliteit
- ✅ Cross-device synchronisatie via database
- ✅ Beveiligde sessie management
- ✅ Automatische purchase tracking

---

## 🚀 STAP 1: DATABASE SETUP

### 1.1 Database aanmaken via cPanel/phpMyAdmin

1. **Log in op je hosting cPanel**
2. **Open phpMyAdmin**
3. **Klik op "Import"**
4. **Upload het bestand**: `includes/database-setup.sql`
5. **Klik op "Go"** - de database tabellen worden automatisch aangemaakt

### 1.2 Database configuratie aanpassen

Open het bestand: **`includes/db-config.php`**

Pas de volgende regel aan naar jouw database gegevens:

```php
define('DB_HOST', 'localhost');          // Meestal 'localhost'
define('DB_NAME', 'missjolie_db');       // Jouw database naam
define('DB_USER', 'root');               // Jouw database gebruikersnaam
define('DB_PASS', '');                   // Jouw database wachtwoord
```

**Voor hosting providers zoals Hostinger/SiteGround:**
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456_missjolie');  // Meestal iets als u123456_dbname
define('DB_USER', 'u123456_user');
define('DB_PASS', 'jouw_wachtwoord_hier');
```

---

## 🔧 STAP 2: BESTANDEN UPLOADEN

Upload alle nieuwe bestanden naar je server:

### PHP Backend (naar `/includes/` map):
- ✅ `db-config.php`
- ✅ `auth-register.php`
- ✅ `auth-login.php`
- ✅ `auth-logout.php`
- ✅ `auth-check.php`
- ✅ `auth-forgot-password.php`
- ✅ `auth-reset-password.php`
- ✅ `save-purchase.php`
- ✅ `webhook.php` (UPDATED)

### HTML Pagina's (naar root `/`):
- ✅ `login.html`
- ✅ `registreer.html`
- ✅ `wachtwoord-vergeten.html`
- ✅ `wachtwoord-reset.html`

### JavaScript (naar `/js/` map):
- ✅ `auth-login.js`
- ✅ `auth-register.js`
- ✅ `auth-forgot-password.js`
- ✅ `auth-reset-password.js`
- ✅ `auth-helper.js`
- ✅ `purchase-helper.js`
- ✅ `account.js` (UPDATED)

---

## 📧 STAP 3: EMAIL CONFIGURATIE

### Optie A: PHP mail() functie (standaard)
Werkt meestal out-of-the-box op de meeste hosting providers.

### Optie B: SMTP (aanbevolen voor betere deliverability)

Installeer PHPMailer:
```bash
composer require phpmailer/phpmailer
```

Update `auth-forgot-password.php` om PHPMailer te gebruiken in plaats van `mail()`.

---

## 🔗 STAP 4: BESTAANDE PAGINA'S UPDATEN

### 4.1 Voeg auth-helper toe aan ALLE pagina's

Open elk HTML bestand (home.html, collections.html, merchandise.html, etc.)

Voeg toe vóór de sluitende `</body>` tag:

```html
<script src="js/auth-helper.js"></script>
<script src="js/script.js"></script>
</body>
```

### 4.2 Update checkout flow

Open: **`js/checkout.js`**

Voeg toe na een succesvolle betaling:

```javascript
// Na succesvolle Mollie redirect
if (localStorage.getItem('loggedIn') === 'true') {
    // Sla purchase op in database
    const purchaseData = {
        purchase_type: 'collection', // of 'merchandise' of 'pass'
        item_id: 'bundle-id',
        item_name: 'Bundel Naam',
        price: 29.99,
        payment_id: molliePaymentId
    };
    
    await savePurchaseToDatabase(purchaseData);
}
```

### 4.3 Update Mollie checkout

Open: **`includes/checkout.php`**

Voeg metadata toe voor automatische purchase tracking:

```php
// Start sessie om user_id te krijgen
session_start();

// Voeg metadata toe aan Mollie payment
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "amount" => [
        "currency" => "EUR",
        "value" => $amount
    ],
    "description" => "Bestelling Miss Jolie",
    "redirectUrl" => "https://miss-jolie.store/betaald.html",
    "webhookUrl" => "https://miss-jolie.store/includes/webhook.php",
    "metadata" => [
        "user_id" => isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null,
        "items" => json_encode($data["items"]) // Stuur items mee
    ]
]));
```

---

## 🎯 STAP 5: TESTEN

### Test Flow:
1. ✅ **Registreer** een nieuw account op `/registreer.html`
2. ✅ **Login** op `/login.html`
3. ✅ **Account pagina** bekijken op `/account.html`
4. ✅ **Logout** via account button
5. ✅ **Wachtwoord vergeten** flow testen
6. ✅ **Test aankoop** en check of deze in account verschijnt

---

## 🔒 BEVEILIGING TIPS

### 1. HTTPS Verplicht
Zorg dat je website HTTPS gebruikt (SSL certificaat).

### 2. Database Wachtwoorden
Gebruik sterke, unieke wachtwoorden voor je database.

### 3. Backup
Maak regelmatig backups van je database:
```bash
mysqldump -u username -p missjolie_db > backup.sql
```

### 4. Error Logging
Controleer regelmatig je error logs:
- PHP error log (meestal in cPanel)
- `mollie-log.txt` voor payment logs

### 5. Rate Limiting
Overweeg rate limiting toe te voegen aan login/registratie endpoints.

---

## 🐛 TROUBLESHOOTING

### "Database verbinding mislukt"
✅ Controleer `db-config.php` instellingen
✅ Controleer of database tabellen zijn aangemaakt
✅ Check database gebruiker rechten

### "Wachtwoord reset email komt niet aan"
✅ Check spam folder
✅ Test met verschillende email providers
✅ Overweeg SMTP te gebruiken in plaats van mail()

### "Session errors"
✅ Zorg dat PHP sessies zijn ingeschakeld op je server
✅ Check folder permissions voor session storage

### "Purchases verschijnen niet"
✅ Check webhook logs in `mollie-log.txt`
✅ Controleer of metadata correct wordt meegegeven in checkout
✅ Test of `save-purchase.php` werkt via Postman/cURL

---

## 📱 CROSS-DEVICE SYNCHRONISATIE

Het systeem gebruikt:
1. **Server-side sessies** via PHP SESSION
2. **Database opslag** voor alle purchases/collections
3. **localStorage** als lokale cache

Wanneer een gebruiker inlogt:
- Data wordt opgehaald uit database
- Gesynchroniseerd naar localStorage
- Bij elke pagina load wordt sessie gevalideerd

---

## 🎉 KLAAR!

Je hebt nu een volledig werkend inlog systeem met:
- ✅ Veilige authenticatie
- ✅ Wachtwoord herstel
- ✅ Cross-device sync
- ✅ Automatische purchase tracking
- ✅ Mollie integratie

### Support
Bij vragen of problemen, check:
- PHP error logs
- Browser console (F12)
- `mollie-log.txt`
- Database voor correcte data

**Veel succes! 🚀**
