# 🔐 Miss Jolie - Authenticatie Systeem

## 📦 Wat is er gemaakt?

Een compleet inlog systeem voor de Miss Jolie website met:

### ✨ Features
- **Email & Wachtwoord Login/Registratie**
- **Wachtwoord Vergeten Functionaliteit**
- **Cross-Device Synchronisatie** (laptop, telefoon, tablet)
- **Beveiligde Database Opslag**
- **Automatische Purchase Tracking**
- **Mollie Payment Integratie**
- **Session Management**

---

## 📁 Aangemaakte Bestanden

### Database
```
includes/
  ├── database-setup.sql          # Database schema
  └── db-config.php              # Database configuratie
```

### Backend (PHP)
```
includes/
  ├── auth-register.php          # Registratie endpoint
  ├── auth-login.php             # Login endpoint
  ├── auth-logout.php            # Logout endpoint
  ├── auth-check.php             # Sessie validatie
  ├── auth-forgot-password.php   # Wachtwoord vergeten
  ├── auth-reset-password.php    # Wachtwoord reset
  ├── save-purchase.php          # Purchase opslaan
  └── webhook.php                # UPDATED - Mollie webhook
```

### Frontend (HTML)
```
├── login.html                   # Login pagina
├── registreer.html              # Registratie pagina
├── wachtwoord-vergeten.html     # Wachtwoord vergeten
└── wachtwoord-reset.html        # Wachtwoord reset
```

### JavaScript
```
js/
  ├── auth-login.js              # Login functionaliteit
  ├── auth-register.js           # Registratie functionaliteit
  ├── auth-forgot-password.js    # Wachtwoord vergeten
  ├── auth-reset-password.js     # Wachtwoord reset
  ├── auth-helper.js             # Helper voor alle pagina's
  ├── purchase-helper.js         # Purchase tracking
  ├── account.js                 # UPDATED - Database integratie
  └── checkout-integration-example.js  # Voorbeeld integratie
```

### Documentatie
```
├── INSTALLATIE-HANDLEIDING.md   # Volledige installatie guide
└── README.md                    # Dit bestand
```

---

## 🚀 Hoe te Installeren?

**Volg de stappen in: [INSTALLATIE-HANDLEIDING.md](INSTALLATIE-HANDLEIDING.md)**

Quick start:
1. Upload database SQL bestand naar phpMyAdmin
2. Pas `db-config.php` aan met jouw database gegevens
3. Upload alle bestanden naar je server
4. Voeg `<script src="js/auth-helper.js"></script>` toe aan alle pagina's
5. Test de registratie/login flow

---

## 🗄️ Database Schema

### Tabellen:
1. **users** - Gebruikers met email & wachtwoord
2. **purchases** - Alle aankopen
3. **user_collections** - Gekochte collections
4. **user_sessions** - Sessie tracking (optioneel)

### Relaties:
```
users (1) ─── (N) purchases
users (1) ─── (N) user_collections
```

---

## 🔐 Beveiliging

- ✅ Password hashing met `password_hash()` (bcrypt)
- ✅ Prepared statements tegen SQL injection
- ✅ CSRF bescherming via sessies
- ✅ Email validatie
- ✅ Input sanitization
- ✅ Secure session management
- ✅ Token-based password reset (1 uur geldig)

---

## 📱 Cross-Device Sync

Het systeem werkt als volgt:

1. **Gebruiker logt in op Laptop**
   - Credentials gecheckt in database
   - Sessie aangemaakt op server
   - User data + purchases naar localStorage

2. **Gebruiker logt in op Telefoon**
   - Credentials gecheckt in database
   - Nieuwe sessie aangemaakt
   - Dezelfde purchases geladen uit database
   - Gesynchroniseerd naar localStorage

3. **Gebruiker koopt iets op Laptop**
   - Purchase opgeslagen in database via webhook
   - Bij volgende refresh/login op telefoon: nieuwe purchase zichtbaar

### Flow Diagram:
```
User Login (any device)
    ↓
PHP Backend validates credentials
    ↓
Session created
    ↓
Database queries purchases/collections
    ↓
Data sent to frontend
    ↓
localStorage updated (cache)
    ↓
Account page displays purchases
```

---

## 🛒 Purchase Tracking

### Automatisch via Mollie Webhook:
```
1. User checkout → Mollie payment
2. Mollie calls webhook.php
3. Payment status = "paid"
4. Purchases saved to database
5. Bij volgende login: purchases zichtbaar
```

### Handmatig via JavaScript:
```javascript
await savePurchaseToDatabase({
    purchase_type: 'collection',
    item_id: 'bundle-1',
    item_name: 'Premium Bundle',
    price: 29.99,
    payment_id: 'tr_xxx'
});
```

---

## 🧪 Testing Checklist

- [ ] Registreer nieuw account
- [ ] Login met nieuw account
- [ ] Check account pagina laadt
- [ ] Logout werkt
- [ ] Wachtwoord vergeten email ontvangen
- [ ] Wachtwoord reset werkt
- [ ] Test purchase (simuleer Mollie betaling)
- [ ] Check purchase verschijnt in account
- [ ] Login op ander device/browser
- [ ] Purchases zichtbaar op ander device

---

## 🎨 UI/UX Features

- **Responsive Design** - Werkt op mobiel & desktop
- **Error Messages** - Duidelijke feedback
- **Loading States** - Visuele feedback tijdens verzoeken
- **Form Validation** - Client & server-side
- **Smooth Redirects** - Met confirmation messages
- **Consistent Styling** - Past bij bestaande design

---

## 🔄 Integratie met Bestaande Code

### Voeg toe aan bestaande pagina's:
```html
<!-- Voor sluitende </body> tag -->
<script src="js/auth-helper.js"></script>
```

### Update je checkout flow:
Zie: `js/checkout-integration-example.js` voor volledig voorbeeld

### Mollie metadata toevoegen:
```php
// In includes/checkout.php
"metadata" => [
    "user_id" => $_SESSION['user_id'] ?? null,
    "items" => json_encode($cartItems)
]
```

---

## 🆘 Support & Troubleshooting

### Veelvoorkomende Problemen:

**"Database verbinding mislukt"**
→ Check `db-config.php` credentials

**"Session errors"**
→ Controleer of PHP sessies enabled zijn

**"Purchases niet zichtbaar"**
→ Check `mollie-log.txt` en database `purchases` tabel

**"Email niet ontvangen"**
→ Check spam folder, overweeg SMTP

### Debug Tips:
- Check browser console (F12) voor JavaScript errors
- Check PHP error log in cPanel
- Check `mollie-log.txt` voor payment logs
- Query database direct via phpMyAdmin

---

## 📈 Toekomstige Uitbreidingen

Mogelijke toevoegingen:
- [ ] 2FA (Two Factor Authentication)
- [ ] OAuth (Google/Facebook login)
- [ ] Email verificatie bij registratie
- [ ] Profile bewerken (wachtwoord wijzigen)
- [ ] Admin panel voor user management
- [ ] Analytics dashboard
- [ ] Wishlist functionaliteit
- [ ] Review/rating systeem

---

## 📞 Contact

Voor vragen over dit systeem:
- Check de [INSTALLATIE-HANDLEIDING.md](INSTALLATIE-HANDLEIDING.md)
- Bekijk de code comments in elk bestand
- Test eerst in een development omgeving

---

## ✅ Samenvatting

Je hebt nu een **productie-klaar authenticatie systeem** met:

✅ Veilige login/registratie
✅ Wachtwoord herstel
✅ Database synchronisatie
✅ Cross-device support
✅ Automatische purchase tracking
✅ Mollie integratie
✅ Session management
✅ Modern & responsive UI

**Alle purchases en collections blijven nu gesynchroniseerd tussen alle apparaten! 🎉**
