# 📚 TRANSIP DATABASE SETUP HANDLEIDING

## 🎯 Stap-voor-stap installatie voor TransIP

### STAP 1: Log in op TransIP phpMyAdmin

1. Ga naar: https://nl01-phpmyadmin.transip.me/index.php
2. Log in met je TransIP database credentials (deze vind je in je TransIP controlpanel)

---

### STAP 2: Selecteer je database

**LET OP:** TransIP maakt meestal al een database voor je aan!

1. Kijk aan de linkerkant naar de database lijst
2. Klik op je database naam (bijvoorbeeld: `deb123456_missjolie` of vergelijkbaar)
3. Als je geen database ziet, maak er dan een aan:
   - Klik op "New" / "Nieuw" bovenaan
   - Voer een database naam in
   - Selecteer: `utf8mb4_unicode_ci` als collation
   - Klik op "Create"

---

### STAP 3: Importeer het SQL bestand

#### Optie A: Via Import (Aanbevolen)

1. Klik op de **"Import"** tab bovenaan
2. Klik op **"Choose File"** / **"Bestand kiezen"**
3. Selecteer het bestand: **`database-setup-transip.sql`**
4. Scroll naar beneden
5. Klik op **"Go"** / **"Start"**
6. ✅ Je ziet een groen succesbericht!

#### Optie B: Via SQL tab (Alternatief)

1. Klik op de **"SQL"** tab bovenaan
2. Open het bestand `database-setup-transip.sql` in Notepad
3. Kopieer ALLE SQL code
4. Plak de code in het SQL venster
5. Klik op **"Go"** / **"Uitvoeren"**

---

### STAP 4: Controleer of tabellen zijn aangemaakt

Aan de linkerkant zou je nu moeten zien:
- ✅ **users** (4 rows)
- ✅ **purchases** (4 rows)
- ✅ **user_collections** (4 rows)
- ✅ **user_sessions** (4 rows)

Klik op elke tabel om te zien of ze correct zijn aangemaakt.

---

### STAP 5: Database credentials opzoeken

#### In TransIP Controlpanel:

1. Log in op https://www.transip.nl/cp/
2. Ga naar je website
3. Klik op **"Databases"** in het menu
4. Hier zie je:
   - **Database naam** (bijv: `deb123456_missjolie`)
   - **Database gebruiker** (bijv: `deb123456`)
   - **Database wachtwoord** (klik op "Toon wachtwoord")
   - **Hostnaam** (meestal `localhost` of `mysql`)

---

### STAP 6: Update db-config.php

Open het bestand: **`includes/db-config.php`**

Vervang de volgende regels met jouw TransIP gegevens:

```php
// Database connectie gegevens
define('DB_HOST', 'localhost');           // TransIP: meestal 'localhost'
define('DB_NAME', 'deb123456_missjolie'); // Jouw database naam uit TransIP
define('DB_USER', 'deb123456');           // Jouw database gebruiker
define('DB_PASS', 'jouw_wachtwoord');     // Jouw database wachtwoord
```

**Voorbeeld met echte TransIP gegevens:**
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'deb654321_missjolie');
define('DB_USER', 'deb654321');
define('DB_PASS', 'XyZ123!@#SecurePass');
```

---

### STAP 7: Upload db-config.php

1. Open FileZilla of TransIP File Manager
2. Upload het aangepaste `db-config.php` bestand naar:
   ```
   /public_html/includes/db-config.php
   ```
3. **Belangrijk:** Overschrijf het oude bestand!

---

### STAP 8: Test de database connectie

#### Test 1: Maak een test bestand

Maak een nieuw bestand: `test-db.php` met deze inhoud:

```php
<?php
require_once 'includes/db-config.php';

try {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch();
    
    echo "✅ Database connectie SUCCESVOL!<br>";
    echo "Aantal users: " . $result['count'] . "<br>";
    echo "Database werkt correct!";
    
} catch (Exception $e) {
    echo "❌ Database connectie MISLUKT!<br>";
    echo "Error: " . $e->getMessage();
}
?>
```

Upload dit naar je root directory en ga naar:
```
https://miss-jolie.store/test-db.php
```

Je zou moeten zien:
```
✅ Database connectie SUCCESVOL!
Aantal users: 0
Database werkt correct!
```

**BELANGRIJK:** Verwijder `test-db.php` daarna weer voor de veiligheid!

---

### STAP 9: Test het inlog systeem

1. Ga naar: https://miss-jolie.store/registreer.html
2. Maak een test account aan
3. Check in phpMyAdmin of er een rij is toegevoegd in de `users` tabel
4. Test inloggen op: https://miss-jolie.store/login.html
5. Check je account pagina: https://miss-jolie.store/account.html

---

## 🔧 TransIP Specifieke Tips

### File Permissions
TransIP stelt automatisch de juiste permissions in, maar als je problemen hebt:
```
includes/ folder: 755
includes/*.php files: 644
```

### PHP Versie
Zorg dat je website minimaal **PHP 7.4** of hoger gebruikt:
1. Ga naar TransIP Controlpanel
2. Klik op je website → "Instellingen"
3. Selecteer "PHP versie" → kies minimaal 7.4 of 8.x

### Error Logs
Als iets niet werkt, check de error logs:
1. TransIP Controlpanel → Je website
2. Klik op "Statistieken & logs"
3. Download de error log

---

## 🐛 Veelvoorkomende Problemen

### "Access denied for user"
➡️ Check of username/password correct zijn in `db-config.php`
➡️ Check of database user rechten heeft op de database

### "Unknown database"
➡️ Check of database naam correct is geschreven
➡️ Check of database bestaat in phpMyAdmin

### "Can't connect to MySQL server"
➡️ Gebruik `localhost` als DB_HOST (niet `mysql` of IP adres)
➡️ Check of database service actief is in TransIP

### "Table doesn't exist"
➡️ Importeer het SQL bestand opnieuw
➡️ Check of je de juiste database hebt geselecteerd

---

## ✅ Checklist

- [ ] Ingelogd op TransIP phpMyAdmin
- [ ] Database geselecteerd/aangemaakt
- [ ] SQL bestand geïmporteerd
- [ ] Alle 4 tabellen zichtbaar in phpMyAdmin
- [ ] Database credentials opgezocht in TransIP
- [ ] `db-config.php` aangepast met juiste gegevens
- [ ] `db-config.php` geüpload naar server
- [ ] Database connectie getest
- [ ] Test account aangemaakt
- [ ] Login systeem werkt

---

## 🎉 Klaar!

Je database is nu volledig ingesteld in TransIP!

Je kunt nu:
- Accounts aanmaken via `/registreer.html`
- Inloggen via `/login.html`
- Wachtwoord resetten via `/wachtwoord-vergeten.html`
- Purchases worden automatisch opgeslagen
- Cross-device sync werkt!

**Support:**
- TransIP Support: https://www.transip.nl/support/
- Check je error logs in het controlpanel
- Test met `test-db.php` (vergeet niet te verwijderen!)
