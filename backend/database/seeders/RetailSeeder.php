<?php

namespace Database\Seeders;

use App\Models\Retail\RetailInventoryItem;
use App\Models\Retail\RetailProduct;
use App\Models\Retail\RetailProductVariant;
use Illuminate\Database\Seeder;

class RetailSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            [
                'name' => 'Shalwar Kameez',
                'category' => 'shalwar-kameez',
                'price' => 1800,
                'sizes' => ['S', 'M', 'L', 'XL'],
                'colors' => ['White', 'Blue', 'Beige'],
            ],
            [
                'name' => "Men's Shirt",
                'category' => 'shirt',
                'price' => 1200,
                'sizes' => ['M', 'L', 'XL'],
                'colors' => ['White', 'Black'],
            ],
            [
                'name' => "Men's Pant",
                'category' => 'pant',
                'price' => 1500,
                'sizes' => ['30', '32', '34', '36'],
                'colors' => ['Black', 'Navy'],
            ],
            [
                'name' => 'Waistcoat',
                'category' => 'waistcoat',
                'price' => 2200,
                'sizes' => ['S', 'M', 'L'],
                'colors' => ['Black', 'Brown'],
            ],
        ];

        foreach ($catalog as $entry) {
            $product = RetailProduct::query()->create([
                'name' => $entry['name'],
                'category' => $entry['category'],
                'description' => null,
                'sale_price' => $entry['price'],
                'is_active' => true,
            ]);

            foreach ($entry['sizes'] as $size) {
                foreach ($entry['colors'] as $color) {
                    $sku = strtoupper(substr($product->name, 0, 3))
                        .'-'.strtoupper($size)
                        .'-'.strtoupper($color)
                        .'-'.uniqid();

                    $variant = RetailProductVariant::query()->create([
                        'retail_product_id' => $product->id,
                        'size' => $size,
                        'color' => $color,
                        'sku' => $sku,
                    ]);

                    RetailInventoryItem::query()->create([
                        'retail_product_variant_id' => $variant->id,
                        'quantity_in_stock' => rand(10, 30),
                        'low_stock_threshold' => 5,
                    ]);
                }
            }
        }
    }
}
