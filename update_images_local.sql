UPDATE "products" SET images = ARRAY['/laptops/APL-MBA-M3-8256.png'] WHERE sku = 'APL-MBA-M3-8256';
UPDATE "products" SET images = ARRAY['/laptops/APL-MBP-M3M-361T.png'] WHERE sku = 'APL-MBP-M3M-361T';
UPDATE "products" SET images = ARRAY['/laptops/ASUS-ROG-G16.png'] WHERE sku = 'ASUS-ROG-G16';
UPDATE "products" SET images = ARRAY['/laptops/HP-OMEN-16.png'] WHERE sku = 'HP-OMEN-16';
UPDATE "products" SET images = ARRAY['/laptops/ASUS-VIVO-GO14.png'] WHERE sku = 'ASUS-VIVO-GO14';
UPDATE "products" SET images = ARRAY['/laptops/HP-14S.png'] WHERE sku = 'HP-14S';

-- Mapped to existing generic images of the correct brand
UPDATE "products" SET images = ARRAY['/lenovo-thinkpad-laptop.jpg'] WHERE sku = 'LEN-LEG-P7I';
UPDATE "products" SET images = ARRAY['/lenovo-thinkpad-laptop.jpg'] WHERE sku = 'LEN-TP-X1C';
UPDATE "products" SET images = ARRAY['/lenovo-thinkpad-laptop.jpg'] WHERE sku = 'LEN-IP-SLIM3';
UPDATE "products" SET images = ARRAY['/lenovo-thinkpad-laptop.jpg'] WHERE sku = 'LEN-TP-T480';
UPDATE "products" SET images = ARRAY['/acer-swift-laptop.jpg'] WHERE sku = 'ACER-PRED-NEO16';
UPDATE "products" SET images = ARRAY['/acer-swift-laptop.jpg'] WHERE sku = 'ACER-ASP-5';

-- For Dell, use hp-pavilion since it's a generic looking silver laptop without massive logos on the inside
UPDATE "products" SET images = ARRAY['/hp-pavilion-laptop.jpg'] WHERE sku = 'DELL-XPS-15';
UPDATE "products" SET images = ARRAY['/hp-pavilion-laptop.jpg'] WHERE sku = 'DELL-INSP-15';
