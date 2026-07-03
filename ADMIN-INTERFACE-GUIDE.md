# Admin Collecties Beheer via Account.html

## Overzicht
De admin interface is toegevoegd aan account.html. Admin gebruikers kunnen hier collecties bewerken, prijzen aanpassen, afbeeldingen uploaden en tiers aan/uit zetten.

## Setup

### 1. Database Kolom Toevoegen
Voer eerst de migratie uit om de `is_admin` kolom toe te voegen:

```sql
-- In phpMyAdmin of je database client:
ALTER TABLE users 
ADD COLUMN is_admin TINYINT(1) DEFAULT 0 AFTER password_hash;
```

Of gebruik het migratiebestand:
- Open `includes/add-admin-column.sql` in phpMyAdmin
- Voer het uit

### 2. Admin Account Maken
Maak een gebruiker admin door in de database:

```sql
UPDATE users SET is_admin = 1 WHERE email = 'jouw-email@example.com';
```

## Gebruik

### Admin Interface Openen
1. Log in met je admin account op de website
2. Ga naar Account pagina
3. Je ziet nu een extra tab: **⚙️ Admin Collecties**

### Collecties Bewerken

#### Basis Informatie
- **Titel**: Wijzig de naam van de collectie
- **Beschrijving**: Update de tekst die gebruikers zien
- **Actief toggle**: Schakel de hele collectie aan/uit
  - Uitgezette collecties verschijnen NIET op de collections pagina

#### Afbeelding Uploaden
1. Klik op "Choose File" onder "Afbeelding uploaden"
2. Selecteer een afbeelding (jpg, png, webp, gif)
3. Preview verschijnt automatisch
4. Klik op "Opslaan" onderaan de pagina
5. Afbeelding wordt geüpload naar `images/uploads/`

#### Prijzen Instellen
Voor elke tier (Brons, Zilver, Goud, Platinum):
- Vul de prijs in (decimalen toegestaan: 19.99)
- Gebruik 0 voor gratis tiers

#### Tiers Aan/Uit Zetten
- **Checkbox aangevinkt** = Tier is zichtbaar voor gebruikers
- **Checkbox uitgevinkt** = Tier wordt NIET getoond in de card

**Belangrijk**: Als een tier is uitgezet:
- Verschijnt deze NIET in de tier selector op collections.html
- Kunnen gebruikers deze tier NIET kopen
- Blijft de tier wel bestaan in de JSON voor toekomstig gebruik

### Wijzigingen Opslaan
1. Bewerk wat je wilt aanpassen
2. Klik op **"💾 Alle Wijzigingen Opslaan"** onderaan de pagina
3. Wacht op bevestiging: "✅ Alle collecties succesvol opgeslagen!"
4. Een backup wordt automatisch gemaakt in `data/collections-backup-DATUM.json`

## Hoe het Werkt

### Frontend (account.js)
- Laadt collections.json
- Rendert bewerkbare formulieren
- Handelt afbeelding uploads af
- Stuurt updates naar backend

### Backend (admin-save.php)
- Ontvangt nieuwe collectie data
- Maakt backup van huidige collections.json
- Schrijft nieuwe data naar collections.json
- Returns success/error status

### Upload (upload.php)
- Ontvangt afbeeldingen
- Controleert bestandstype (jpg, png, webp, gif)
- Slaat op in `images/uploads/` met unieke naam
- Returns nieuwe bestandslocatie

### Collections Weergave (collections.js)
- Leest collections.json
- **Filtert automatisch uitgezette tiers**: `const tiers = Object.keys(col.tiers).filter(t => col.tiers[t]);`
- Toont alleen actieve collecties
- Toont alleen collecties die bij de huidige mode horen (miss/mistress)

## Beveiliging

### Admin Check
- `auth-check.php` controleert `is_admin` kolom
- Alleen admin users zien de admin tab
- Check gebeurt op basis van database waarde

### Aanbevelingen
- Gebruik sterke wachtwoorden voor admin accounts
- Beperk aantal admin accounts
- Monitor wie admin toegang heeft

## Troubleshooting

### "Admin tab verschijnt niet"
- Check of `is_admin = 1` in database
- Check browser console voor errors
- Ververs de pagina na database update

### "Afbeelding upload mislukt"
- Check of `images/uploads/` directory bestaat en schrijfbaar is
- Check bestandsgrootte (max meestal 8MB)
- Check bestandstype (alleen jpg, png, webp, gif)

### "Wijzigingen worden niet opgeslagen"
- Check browser console voor errors
- Controleer of `includes/admin-save.php` werkt
- Check bestandspermissies van `includes/collections.json`

### "Tier verschijnt nog steeds na uitschakelen"
- Hard refresh de pagina (Ctrl+F5)
- Check of opslaan succesvol was
- Controleer collections.json direct

## Bestanden

### Gewijzigde Bestanden
- `account.html` - Admin tab & styling toegevoegd
- `account.js` - Admin functionaliteit toegevoegd
- `includes/auth-check.php` - is_admin check toegevoegd
- `includes/admin-save.php` - Verbeterde error handling
- `includes/upload.php` - Support voor beide file/image namen
- `includes/database-setup.sql` - is_admin kolom toegevoegd
- `includes/database-setup-transip.sql` - is_admin kolom toegevoegd

### Nieuwe Bestanden
- `includes/add-admin-column.sql` - Migratie voor bestaande databases
- `ADMIN-INTERFACE-GUIDE.md` - Deze handleiding

### Directory
- `images/uploads/` - Nieuwe directory voor geüploade afbeeldingen

## Tips

1. **Test eerst lokaal** voordat je op production deployed
2. **Maak handmatig een backup** van collections.json voor je grote wijzigingen doet
3. **Upload kwalitatieve afbeeldingen** (min. 800x600px aanbevolen)
4. **Gebruik consistente prijzen** voor vergelijkbare tiers
5. **Check de live site** na wijzigingen om te zien of alles correct werkt
