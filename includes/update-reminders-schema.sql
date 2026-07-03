-- Update bookings table voor two-stage reminder systeem
-- 1 uur reminder + 5 minuten reminder met video call link

-- Voeg nieuwe reminder kolommen toe
-- BELANGRIJK: Als je deze al hebt toegevoegd, zal dit een error geven - dat is normaal, negeer de error
ALTER TABLE bookings 
ADD COLUMN reminder_1h_sent TINYINT(1) DEFAULT 0 AFTER payment_status,
ADD COLUMN reminder_1h_sent_at DATETIME NULL AFTER reminder_1h_sent,
ADD COLUMN reminder_5m_sent TINYINT(1) DEFAULT 0 AFTER reminder_1h_sent_at,
ADD COLUMN reminder_5m_sent_at DATETIME NULL AFTER reminder_5m_sent,
ADD COLUMN video_call_link VARCHAR(500) NULL AFTER reminder_5m_sent_at,
ADD INDEX idx_reminder_1h (reminder_1h_sent, booking_date, booking_time),
ADD INDEX idx_reminder_5m (reminder_5m_sent, booking_date, booking_time);
