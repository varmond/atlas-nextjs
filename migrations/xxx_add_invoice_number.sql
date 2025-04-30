-- First, create a temporary sequence for existing records
CREATE SEQUENCE IF NOT EXISTS temp_invoice_number_seq START WITH 1000;

-- Update existing records with incremental numbers
UPDATE "Invoice" 
SET "invoiceNumber" = nextval('temp_invoice_number_seq')
WHERE "invoiceNumber" IS NULL;

-- Drop the temporary sequence
DROP SEQUENCE temp_invoice_number_seq; 