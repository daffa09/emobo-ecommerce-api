-- Create ENUM types
DO $$ BEGIN
    CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing tables to recreate (WARNING: Data Loss)
DROP TABLE IF EXISTS "monitor_stock" CASCADE;
DROP TABLE IF EXISTS "conditions" CASCADE;
DROP TABLE IF EXISTS "brands" CASCADE;
-- Drop existing tables to recreate (WARNING: Data Loss)
DROP TABLE IF EXISTS "inbound_items" CASCADE;
DROP TABLE IF EXISTS "inbound_transactions" CASCADE;
DROP TABLE IF EXISTS "contact_messages" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "reviews" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "order_item" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "refresh_tokens" CASCADE;
DROP TABLE IF EXISTS "registers" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "profiles" CASCADE;
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;

-- Create tables

CREATE TABLE "brands" (
    "brand_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL UNIQUE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL
);

CREATE TABLE "conditions" (
    "condition_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL UNIQUE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL
);

CREATE TABLE "profiles" (
    "profile_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(25) NOT NULL,
    "image" TEXT,
    "address" VARCHAR(255),
    "address_notes" VARCHAR(255),
    "province_id" TEXT,
    "city_id" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION
);

CREATE TABLE "users" (
    "user_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(50) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "reset_password_token" VARCHAR(255) UNIQUE,
    "reset_password_expires" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "profile_id" UUID UNIQUE,
    CONSTRAINT "users_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("profile_id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "registers" (
    "register_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" VARCHAR(255) UNIQUE,
    "user_id" UUID NOT NULL UNIQUE,
    CONSTRAINT "registers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL UNIQUE,
    "user_id" UUID NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP NOT NULL,
    CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "products" (
    "product_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "sku" VARCHAR(100) NOT NULL UNIQUE,
    "serial_number" VARCHAR(100) UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "price" DECIMAL NOT NULL,
    "buy_price" DECIMAL NOT NULL DEFAULT 0,
    "brand_id" UUID NOT NULL,
    "description" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "specifications" JSONB NOT NULL DEFAULT '{}',
    "condition_id" UUID NOT NULL,
    "warranty" VARCHAR(100),
    "weight" INTEGER NOT NULL DEFAULT 1500,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,
    CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("brand_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "products_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "conditions"("condition_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "monitor_stock" (
    "monitor_stock_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL UNIQUE,
    "current_stock" INTEGER NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "monitor_stock_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE CASCADE ON UPDATE CASCADE
);



CREATE TABLE "orders" (
    "order_id" VARCHAR(100) NOT NULL PRIMARY KEY,
    "profile_id" UUID NOT NULL,
    "total_grand" DECIMAL NOT NULL,
    "shipping_cost" DECIMAL NOT NULL DEFAULT 0,
    "shipping_service" VARCHAR(100),
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "shipping_addr" JSONB NOT NULL,
    "phone" VARCHAR(25) NOT NULL,
    "tracking_no" VARCHAR(100),
    "estimated_days" INTEGER,
    "shipped_at" TIMESTAMP,
    "delivery_notified_at" TIMESTAMP,
    "tax_amount" DECIMAL NOT NULL DEFAULT 0,
    "app_fee" DECIMAL NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    CONSTRAINT "orders_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("profile_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "order_item" (
    "order_item_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" VARCHAR(100) NOT NULL,
    "product_id" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit_price" DECIMAL NOT NULL,
    "total_price" DECIMAL NOT NULL,
    CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "payments" (
    "payment_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" VARCHAR(100) NOT NULL UNIQUE,
    "provider" VARCHAR(100) NOT NULL,
    "provider_id" VARCHAR(255),
    "snap_token" VARCHAR(255),
    "redirect_url" VARCHAR(255),
    "amount" DECIMAL NOT NULL,
    "installment_no" INTEGER NOT NULL DEFAULT 1,
    "installment_total" INTEGER NOT NULL DEFAULT 1,
    "paid_amount" DECIMAL NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "paid_at" TIMESTAMP,
    CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "reviews" (
    "review_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" VARCHAR(100) NOT NULL,
    "product_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("profile_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "notifications" (
    "notification_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "inbound_transactions" (
    "inbound_transaction_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "receipt_url" VARCHAR(255) NOT NULL,
    "total_items_on_receipt" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL
);

CREATE TABLE "inbound_items" (
    "inbound_item_id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "inbound_transaction_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "buy_price" DECIMAL NOT NULL DEFAULT 0,
    "price" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "inbound_items_inbound_transaction_id_fkey" FOREIGN KEY ("inbound_transaction_id") REFERENCES "inbound_transactions"("inbound_transaction_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inbound_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Baseline riwayat migration Prisma.
-- File ini sudah setara hasil semua migration di prisma/migrations, jadi tandai
-- semuanya "applied" supaya `prisma migrate deploy` waktu container boot bilang
-- "No pending migrations" dan bukan malah coba jalanin ulang dari nol.
-- Checksum = sha256 isi migration.sql; kalau nambah migration baru, tambahkan
-- barisnya di sini juga (atau biarkan migrate deploy yang menerapkannya).
CREATE TABLE "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "started_at", "finished_at", "applied_steps_count")
SELECT gen_random_uuid()::text, v.checksum, v.name, now(), now(), 1
FROM (VALUES
    ('63344158515e207964232bb09a47276db4647972420839cd5f96857e0026b17b', '20251124003010_init'),
    ('b932f849fbeb56ead63569fb0be98ffd0e446400158f68ff299af846c21adcf0', '20260125124107_init_schema'),
    ('e7bff50fc87c155b9da0e8811b956fbe5841bc100671edca41ff400058a6afa6', '20260201102417_add_email_verification'),
    ('81df4409cc4e4445dd874a6d62f9c8a346e78ad40cc74e74264590cad5beba30', '20260201104117_add_category_to_product'),
    ('ac071fb1269837898522819250a55975484610c741feff67f14da5678a9fe73b', '20260201110944_add_password_reset_fields'),
    ('94f3aed6a88d920312409d5cf342d715e29e7952cc7aef14f49ef0547111e4d4', '20260206165347_add_product_specs'),
    ('2654948e7d93543f3a8bba48e65a5bf4b0e7e3172af7ee341b1d7b18ecb6e421', '20260207161812_add_soft_delete_to_product'),
    ('09093c16ab65d7f7d25ddeb1b64de7b5a7b45fe9981f69995487f7755fcdba02', '20260207164417_add_address_to_user'),
    ('e4e0f89c6aef6888dc136fb509c307d062431bcdc650df9f62c91a38a454b72d', '20260319143621_add_order_delivery_fields'),
    ('3a4b9268cf9bbe78fd2cf6116417606eccddd5c120749a61964e1fcd2f822327', '20260319150005_add_location_to_user'),
    ('26a3040ad4f2c112c3faa62c3f48a1a25f9ca7acb6a74ccdd07db9c7feb489b9', '20260319151210_add_address_notes_to_user'),
    ('e6a3b4c95aad6ce04b203c6d0b62833f3ae368264a5939373dea299408dfb3a1', '20260321220055_add_ppn_and_app_fee'),
    ('e51d50e5920afdbf6720c0d9077343e84bc5ded79ab78d8af8031e4d66445e88', '20260328150553_add_purchase_order'),
    ('67a4cc7262ff662a8fde0530e5b4392f4f8cc7f4ba9619b5e4d13a97da8fd1dc', '20260721000000_payment_installments')
) AS v(checksum, name);

-- Default Admin Seed
WITH inserted_profile AS (
    INSERT INTO "profiles" (
        "name", 
        "phone"
    )
    VALUES (
        'Admin Emobo', 
        '-'
    )
    RETURNING profile_id
), inserted_user AS (
    INSERT INTO "users" (
        "email", 
        "password_hash", 
        "role", 
        "created_at", 
        "updated_at",
        "profile_id"
    )
    SELECT 
        'admin@emobo.com', 
        '$2b$10$xC/hWtuN788gj5saGqEsGeqwqaeEnnyEV3R3p9SfoKn4cEL5Os.we', -- Hash dari 'password123'
        'ADMIN', 
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP,
        profile_id
    FROM inserted_profile
    RETURNING user_id
)
INSERT INTO "registers" (
    "is_email_verified",
    "user_id"
)
SELECT 
    true, 
    user_id
FROM inserted_user;

-- Default Conditions Seed
INSERT INTO "conditions" ("name", "updated_at") VALUES ('New', CURRENT_TIMESTAMP), ('Second', CURRENT_TIMESTAMP);


CREATE OR REPLACE VIEW "monitor_stock_view" AS
SELECT 
    p.product_id AS product_id,
    COALESCE(po.qty_in, 0) AS qty_in,
    COALESCE(o.qty_out, 0) AS qty_out,
    (COALESCE(po.qty_in, 0) - COALESCE(o.qty_out, 0))::INTEGER AS current_stock
FROM "products" p
LEFT JOIN (
    SELECT product_id, SUM(qty)::INTEGER AS qty_in 
    FROM "inbound_items" 
    GROUP BY product_id
) po ON p.product_id = po.product_id
LEFT JOIN (
    SELECT oi.product_id, SUM(oi.qty)::INTEGER AS qty_out 
    FROM "order_item" oi
    JOIN "orders" ord ON oi.order_id = ord.order_id
    WHERE ord.status != 'CANCELLED'
    GROUP BY oi.product_id
) o ON p.product_id = o.product_id;


CREATE OR REPLACE VIEW "stock_report_view" AS
SELECT 
    p.product_id AS product_id,
    COALESCE(po.qty_in, 0) AS qty_in,
    COALESCE(o.qty_out, 0) AS qty_out
FROM "products" p
LEFT JOIN (
    SELECT product_id, SUM(qty)::INTEGER AS qty_in 
    FROM "inbound_items" 
    GROUP BY product_id
) po ON p.product_id = po.product_id
LEFT JOIN (
    SELECT oi.product_id, SUM(oi.qty)::INTEGER AS qty_out 
    FROM "order_item" oi
    JOIN "orders" ord ON oi.order_id = ord.order_id
    WHERE ord.status != 'CANCELLED'
    GROUP BY oi.product_id
) o ON p.product_id = o.product_id;
