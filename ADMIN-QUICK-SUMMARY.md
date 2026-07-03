# Admin Functionaliteit - Snel Overzicht

## ✅ Wat is toegevoegd?

### 1. Admin Interface in Account.html
- Nieuwe tab "⚙️ Admin Collecties" (alleen zichtbaar voor admins)
- Volledig bewerkbare interface voor alle collecties
- Real-time preview van afbeeldingen

### 2. Functionaliteit
✅ **Prijzen aanpassen** - Voor alle tiers (Brons, Zilver, Goud, Platinum)
✅ **Afbeeldingen uploaden** - Via file upload met preview
✅ **Beschrijvingen bewerken** - Volledige tekstbewerking
✅ **Tiers aan/uit zetten** - Checkbox per tier
✅ **Collections activeren/deactiveren** - Master toggle per collectie
✅ **Automatische JSON update** - Schrijft naar includes/collections.json
✅ **Backup systeem** - Automatisch backup bij elke save

### 3. Hoe het Werkt

**Tier Toggle Functionaliteit:**
- ✓ Tier checkbox **AAN** → Tier verschijnt in card voor gebruikers
- ✗ Tier checkbox **UIT** → Tier verdwijnt uit card (niet meer te kopen)
- Prijzen blijven behouden ook als tier uit staat
- collections.js filtert automatisch: `filter(t => col.tiers[t])`

**Prijs & Beschrijving:**
- Wijzigingen worden opgeslagen in collections.json
- Gelden direct voor alle gebruikers na save
- Decimalen ondersteund (bijv. 19.99)

**Afbeelding Upload:**
- Upload naar `images/uploads/`
- Ondersteunt: jpg, jpeg, png, webp, gif
- Automatische unieke bestandsnaam
- Preview voor en na upload

## 🚀 Snel Starten

### Stap 1: Database Voorbereiden
```sql
-- Voeg is_admin kolom toe
ALTER TABLE users ADD COLUMN is_admin TINYINT(1) DEFAULT 0 AFTER password_hash;

-- Maak jezelf admin
UPDATE users SET is_admin = 1 WHERE email = 'jouw-email@example.com';
```

### Stap 2: Inloggen als Admin
1. Log in op de website
2. Ga naar Account
3. Klik op tab "⚙️ Admin Collecties"

### Stap 3: Bewerken
1. Wijzig wat je wilt (prijzen, beschrijving, afbeelding, tiers)
2. Klik "💾 Alle Wijzigingen Opslaan"
3. Wacht op bevestiging
4. Klaar! ✅

## 📁 Aangepaste Bestanden

### Frontend
- ✏️ `account.html` - Admin interface HTML & styling
- ✏️ `js/account.js` - Admin logica & save functionaliteit

### Backend
- ✏️ `includes/auth-check.php` - Admin check toegevoegd
- ✏️ `includes/admin-save.php` - Verbeterd met error handling
- ✏️ `includes/upload.php` - Support voor image uploads

### Database
- ✏️ `includes/database-setup.sql` - is_admin kolom
- ✏️ `includes/database-setup-transip.sql` - is_admin kolom
- 🆕 `includes/add-admin-column.sql` - Migratie script

### Documentatie
- 🆕 `ADMIN-INTERFACE-GUIDE.md` - Volledige handleiding
- 🆕 `ADMIN-QUICK-SUMMARY.md` - Dit bestand

### Directories
- 🆕 `images/uploads/` - Voor geüploade afbeeldingen

## 🎯 Belangrijkste Features

### ✅ Prijzen Aanpassen
- Input velden per tier
- Decimalen ondersteund
- Onmiddellijk effect na opslaan

### ✅ Afbeeldingen Uploaden  
- Drag & drop of kies bestand
- Live preview
- Automatische opslag in uploads folder

### ✅ Tier Toggle (AAN/UIT)
**Dit was je belangrijkste vraag!**
- Checkbox **UIT** = tier **NIET** zichtbaar in card
- Checkbox **AAN** = tier **WEL** zichtbaar in card
- Gebruikers kunnen alleen actieve tiers kopen
- Filter werkt automatisch via collections.js

### ✅ Beschrijving Bewerken
- Textarea voor volledige tekst
- Onbeperkte lengte
- Ondersteunt speciale karakters

### ✅ Collections Aan/Uit
- Master toggle boven elke collectie
- UIT = hele collectie verdwijnt van site
- AAN = collectie is zichtbaar (als mode correct is)

## ⚡ Snelle Test

1. Log in als admin
2. Ga naar Account → Admin Collecties
3. Kies een collectie (bijv. "JOI Pakket")
4. Vink **Brons** tier **UIT**
5. Wijzig prijs van Zilver naar €25
6. Upload nieuwe afbeelding (optioneel)
7. Klik **Opslaan**
8. Ga naar Collections pagina
9. Check: Brons tier is **WEG**, Zilver kost nu **€25** ✅

## 🔒 Beveiliging

- ✅ Alleen is_admin=1 users zien admin tab
- ✅ Auth-check op backend
- ✅ Automatische backups
- ✅ Bestandstype validatie bij upload
- ✅ SQL injection bescherming via prepared statements

## ❓ Problemen?

**Admin tab niet zichtbaar?**
→ Check `is_admin = 1` in database

**Afbeelding upload faalt?**
→ Check of `images/uploads/` bestaat en schrijfbaar is

**Tier verdwijnt niet?**
→ Hard refresh (Ctrl+F5) na opslaan

**Wijzigingen niet opgeslagen?**
→ Check browser console voor errors

## 📞 Meer Info?

Zie `ADMIN-INTERFACE-GUIDE.md` voor uitgebreide handleiding met screenshots en troubleshooting.
