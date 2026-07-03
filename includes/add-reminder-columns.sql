-- Add reminder columns to bookings table
ALTER TABLE bookings 
ADD COLUMN reminder_sent TINYINT(1) DEFAULT 0 AFTER payment_status,
ADD COLUMN reminder_sent_at DATETIME NULL AFTER reminder_sent,
ADD INDEX idx_reminder_sent (reminder_sent, booking_date, booking_time);
