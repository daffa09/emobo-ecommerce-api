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

-- Drop existing tables to recreate (WARNING: Data Loss)
DROP TABLE IF EXISTS "purchase_order_item" CASCADE;
DROP TABLE IF EXISTS "purchase_orders" CASCADE;
DROP TABLE IF EXISTS "contact_messages" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "reviews" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "order_item" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "refresh_tokens" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "profiles" CASCADE;

-- Create tables

CREATE TABLE "profiles" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(25) NOT NULL,
    "image" TEXT,
    "address" VARCHAR(255),
    "address_notes" VARCHAR(255),
    "province_id" UUID,
    "city_id" UUID,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION
);

CREATE TABLE "users" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(50) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" VARCHAR(255) UNIQUE,
    "reset_password_token" VARCHAR(255) UNIQUE,
    "reset_password_expires" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "profile_id" UUID UNIQUE,
    CONSTRAINT "users_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL UNIQUE,
    "user_id" UUID NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP NOT NULL,
    CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "products" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "sku" VARCHAR(100) NOT NULL UNIQUE,
    "serial_number" VARCHAR(100) UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "price" DECIMAL NOT NULL,
    "buy_price" DECIMAL NOT NULL DEFAULT 0,
    "brand" VARCHAR(100) NOT NULL,
    "category" VARCHAR(100) NOT NULL DEFAULT 'General',
    "description" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT,
    "specifications" JSONB NOT NULL DEFAULT '{}',
    "condition" VARCHAR(50) NOT NULL DEFAULT 'NEW',
    "warranty" VARCHAR(100),
    "weight" INTEGER NOT NULL DEFAULT 1500,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP
);

CREATE TABLE "orders" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
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
    CONSTRAINT "orders_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "order_item" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit_price" DECIMAL NOT NULL,
    "total_price" DECIMAL NOT NULL,
    CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "payments" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL UNIQUE,
    "provider" VARCHAR(100) NOT NULL,
    "provider_id" VARCHAR(255),
    "snap_token" VARCHAR(255),
    "redirect_url" VARCHAR(255),
    "amount" DECIMAL NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "paid_at" TIMESTAMP,
    CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "reviews" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "notifications" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "contact_messages" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "receipt_url" VARCHAR(255) NOT NULL,
    "total_items_on_receipt" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL
);

CREATE TABLE "purchase_order_item" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "purchase_order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "purchase_order_item_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "purchase_order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Views
CREATE OR REPLACE VIEW sales_reports_view AS
SELECT
    o.id AS order_id,
    o.created_at AS order_date,
    p.name AS customer_name,
    o.total_grand AS total_amount,
    COALESCE(SUM(
        (oi.unit_price / 1.11 - COALESCE(prod.buy_price, 0)) * oi.qty
    ), 0) AS total_profit
FROM orders o
LEFT JOIN profiles p ON o.profile_id = p.id
LEFT JOIN order_item oi ON o.id = oi.order_id
LEFT JOIN products prod ON oi.product_id = prod.id
WHERE o.status = 'COMPLETED'
GROUP BY o.id, o.created_at, p.name, o.total_grand;


CREATE OR REPLACE VIEW incoming_goods_reports_view AS
SELECT 
    po.id AS po_id,
    po.created_at AS po_date,
    po.receipt_url,
    po.notes,
    COALESCE(SUM(poi.quantity), 0) AS total_quantity,
    COALESCE(SUM(poi.quantity * COALESCE(prod.buy_price, 0)), 0) AS total_cost
FROM purchase_orders po
LEFT JOIN purchase_order_item poi ON po.id = poi.purchase_order_id
LEFT JOIN products prod ON poi.product_id = prod.id
GROUP BY po.id, po.created_at, po.receipt_url, po.notes;

