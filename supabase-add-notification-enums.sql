-- Add the newly integrated notification enums safely
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'NEW_CONTRACT';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ACCOUNT_ACTIVATED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ACCOUNT_REJECTED';
