# ✅ Admin Setup Checklist

Gebruik deze checklist om de admin functionaliteit te activeren.

## Stap 1: Database Updaten ⚙️

### Optie A: Nieuwe Database
Als je een **nieuwe** database aanmaakt:
- [x] Gebruik `includes/database-setup.sql` (heeft al is_admin kolom)
- [x] Of gebruik `includes/database-setup-transip.sql` voor TransIP

### Optie B: Bestaande Database
Als je database al bestaat:
- [ ] Open phpMyAdmin
- [ ] Selecteer je database (bijv. `missjolie_db`)
- [ ] Ga naar SQL tab
- [ ] Plak en voer uit:
```sql
ALTER TABLE users ADD COLUMN is_admin TINYINT(1) DEFAULT 0 AFTER password_hash;
```
- [ ] Of upload en voer `includes/add-admin-column.sql` uit

## Stap 2: Admin Account Maken 👤

- [ ] Ga naar phpMyAdmin → users tabel
- [ ] Vind je email adres
- [ ] Klik "Edit" (potlood icoon)
- [ ] Zet `is_admin` op `1`
- [ ] Klik "Go" om op te slaan

**Of via SQL:**
```sql
UPDATE users SET is_admin = 1 WHERE email = 'jouw-email@example.com';
```

## Stap 3: Test de Interface 🧪

- [ ] Log uit en weer in op de website
- [ ] Ga naar je Account pagina
- [ ] Zie je de tab **"⚙️ Admin Collecties"**?
  - ✅ JA → Perfect! Ga door naar stap 4
  - ❌ NEE → Controleer:
    - [ ] is_admin = 1 in database?
    - [ ] Correct ingelogd?
    - [ ] Browser cache geleegd? (Ctrl+F5)
    - [ ] Console errors? (F12)

## Stap 4: Test Functionaliteit 🎮

### Test 1: Prijzen Aanpassen
- [ ] Ga naar Admin Collecties tab
- [ ] Kies een collectie
- [ ] Wijzig een prijs (bijv. Zilver naar €25)
- [ ] Klik "💾 Alle Wijzigingen Opslaan"
- [ ] Zie je: "✅ Alle collecties succesvol opgeslagen!"?
- [ ] Ga naar Collections pagina
- [ ] Klopt de nieuwe prijs? ✅

### Test 2: Tier Aan/Uit Zetten
- [ ] Ga terug naar Admin Collecties
- [ ] Vink de **Brons** checkbox **UIT** bij een collectie
- [ ] Klik opslaan
- [ ] Ga naar Collections pagina
- [ ] Is de Brons tier **WEG** uit de tier selector? ✅

### Test 3: Afbeelding Upload
- [ ] Ga naar Admin Collecties
- [ ] Klik "Choose File" bij een collectie
- [ ] Selecteer een afbeelding (jpg/png)
- [ ] Zie je een preview verschijnen?
- [ ] Klik opslaan
- [ ] Controleer of `images/uploads/` de nieuwe afbeelding bevat
- [ ] Ververs Collections pagina
- [ ] Zie je de nieuwe afbeelding? ✅

### Test 4: Beschrijving Wijzigen
- [ ] Wijzig de beschrijving van een collectie
- [ ] Opslaan
- [ ] Check Collections pagina
- [ ] Klopt de nieuwe tekst? ✅

### Test 5: Collectie Activeren/Deactiveren
- [ ] Zet de "Actief" toggle **UIT** bij een collectie
- [ ] Opslaan
- [ ] Ga naar Collections pagina
- [ ] Is de collectie **VERDWENEN**? ✅
- [ ] Ga terug naar Admin
- [ ] Zet "Actief" toggle weer **AAN**
- [ ] Opslaan
- [ ] Is de collectie terug op Collections pagina? ✅

## Stap 5: Backup Check 💾

- [ ] Ga naar je `data/` folder
- [ ] Zie je bestanden zoals: `collections-backup-2025-12-19-14-30-15.json`?
- [ ] ✅ JA → Backup systeem werkt!
- [ ] ❌ NEE → Check of `data/` folder bestaat en schrijfbaar is

## Stap 6: Security Check 🔒

- [ ] Log uit
- [ ] Ga naar Account pagina (je wordt naar login gestuurd)
- [ ] Log in met een **NIET-admin** account
- [ ] Ga naar Account
- [ ] Zie je de Admin Collecties tab?
  - ❌ NEE (correct!) → Admin tab is verborgen ✅
  - ✅ JA (fout!) → Check is_admin waarde in database

## Troubleshooting 🔧

### Admin Tab Verschijnt Niet
```javascript
// Open browser console (F12)
// Check deze waarden:
localStorage.getItem('loggedIn')  // moet 'true' zijn
// In Network tab → auth-check.php response → user.is_admin moet 1 zijn
```

### Opslaan Werkt Niet
```javascript
// Browser console (F12) → kijk naar errors
// Check Network tab → admin-save.php → moet 200 OK zijn
```

### Afbeelding Upload Faalt
```bash
# Check folder permissies (op server):
chmod 755 images/uploads/

# Of in cPanel File Manager:
# Rechtermuisklik op uploads folder → Permissions → 755
```

### Tiers Verdwijnen Niet
```javascript
// Hard refresh:
// Windows: Ctrl + F5
// Mac: Cmd + Shift + R

// Of: Clear browser cache
```

## ✅ Alles Werkt!

Gefeliciteerd! Je admin interface is volledig functioneel.

### Quick Tips:
1. **Maak regelmatig backups** - Ze staan in `data/` maar download ze ook lokaal
2. **Test lokaal eerst** voordat je op production wijzigingen maakt  
3. **Gebruik kwalitatieve afbeeldingen** - Min. 800x600px
4. **Wees voorzichtig met tiers** - Zet alleen uit wat je zeker weet
5. **Check live site** na elke wijziging

### Volgende Stappen:
- 📖 Lees `ADMIN-INTERFACE-GUIDE.md` voor gedetailleerde info
- 🎨 Pas collecties aan naar wens
- 🖼️ Upload professionele afbeeldingen
- 💰 Stel logische prijzen in per tier
- 🎯 Toggle tiers op basis van beschikbare content

## Hulp Nodig?

Zie deze bestanden:
- `ADMIN-INTERFACE-GUIDE.md` - Volledige handleiding
- `ADMIN-QUICK-SUMMARY.md` - Korte samenvatting
- Console log in browser (F12) - Voor tech errors

---

**Ready to go! 🚀**
