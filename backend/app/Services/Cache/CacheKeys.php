<?php

namespace App\Services\Cache;

use Illuminate\Support\Facades\Cache;

/**
 * Single registry of every cache key and TTL used by the application.
 * The file cache driver (Hostinger shared hosting has no Redis) doesn't
 * support tag-based invalidation, so each key embeds a per-resource
 * "version" number read from cache itself. CacheBuster::bump() increments
 * that version, which makes every previously-built key for that resource
 * unreachable — a generational-cache substitute for tags. Controllers only
 * ever build keys through this class; CacheBuster is the only thing that
 * changes what a key resolves to.
 */
class CacheKeys
{
    // ---- TTLs, in seconds ----
    public const DASHBOARD_TTL = 300;           // 5 minutes
    public const ORDERS_TTL = 180;               // 3 minutes
    public const CUSTOMERS_TTL = 1800;           // 30 minutes
    public const KARIGAR_TTL = 600;               // 10 minutes
    public const PAYMENTS_TTL = 180;              // 3 minutes
    public const SETTINGS_TTL = 3600;             // 1 hour
    public const MEASUREMENT_TEMPLATES_TTL = 86400; // 24 hours
    public const RETAIL_PRODUCTS_TTL = 900;       // 15 minutes
    public const RETAIL_INVENTORY_TTL = 120;      // 2 minutes
    public const RETAIL_SALES_TTL = 180;          // 3 minutes
    public const RETAIL_DASHBOARD_TTL = 300;      // 5 minutes

    // ---- Resource names — the versioning bucket + key prefix for each ----
    public const RESOURCE_DASHBOARD = 'dashboard';
    public const RESOURCE_ORDERS = 'orders';
    public const RESOURCE_CUSTOMERS = 'customers';
    public const RESOURCE_KARIGARS = 'karigars';
    public const RESOURCE_PAYMENTS = 'payments';
    public const RESOURCE_SETTINGS = 'settings';
    public const RESOURCE_TEMPLATES = 'templates';
    public const RESOURCE_RETAIL_PRODUCTS = 'retail_products';
    public const RESOURCE_RETAIL_INVENTORY = 'retail_inventory';
    public const RESOURCE_RETAIL_SALES = 'retail_sales';
    public const RESOURCE_RETAIL_DASHBOARD = 'retail_dashboard';

    public static function version(string $resource): int
    {
        return (int) Cache::get(self::versionKey($resource), 1);
    }

    public static function versionKey(string $resource): string
    {
        return "cache_version:{$resource}";
    }

    private static function build(string $resource, string $suffix = ''): string
    {
        $key = "{$resource}:v".self::version($resource);

        return $suffix === '' ? $key : "{$key}:{$suffix}";
    }

    // ---- Dashboard ----
    public static function dashboard(): string
    {
        return self::build(self::RESOURCE_DASHBOARD);
    }

    // ---- Orders ----
    public static function orders(array $filters): string
    {
        return self::build(self::RESOURCE_ORDERS, 'index:'.md5(json_encode($filters)));
    }

    public static function orderShow(int $id): string
    {
        return self::build(self::RESOURCE_ORDERS, "show:{$id}");
    }

    // ---- Customers ----
    public static function customers(?string $q): string
    {
        return self::build(self::RESOURCE_CUSTOMERS, 'index:'.md5((string) $q));
    }

    public static function customerShow(int $id): string
    {
        return self::build(self::RESOURCE_CUSTOMERS, "show:{$id}");
    }

    public static function customerMeasurements(int $id): string
    {
        return self::build(self::RESOURCE_CUSTOMERS, "measurements:{$id}");
    }

    // ---- Karigars ----
    public static function karigars(): string
    {
        return self::build(self::RESOURCE_KARIGARS, 'index');
    }

    public static function karigarShow(int $id, ?string $month): string
    {
        return self::build(self::RESOURCE_KARIGARS, "show:{$id}:".md5((string) $month));
    }

    // ---- Payments ----
    public static function payments(array $filters): string
    {
        return self::build(self::RESOURCE_PAYMENTS, 'index:'.md5(json_encode($filters)));
    }

    public static function paymentsSummary(): string
    {
        return self::build(self::RESOURCE_PAYMENTS, 'summary');
    }

    public static function paymentsBalances(): string
    {
        return self::build(self::RESOURCE_PAYMENTS, 'balances');
    }

    // ---- Settings & templates ----
    public static function settings(): string
    {
        return self::build(self::RESOURCE_SETTINGS);
    }

    public static function templates(): string
    {
        return self::build(self::RESOURCE_TEMPLATES);
    }

    // ---- Retail products ----
    public static function retailProducts(): string
    {
        return self::build(self::RESOURCE_RETAIL_PRODUCTS, 'index');
    }

    public static function retailProductShow(int $id): string
    {
        return self::build(self::RESOURCE_RETAIL_PRODUCTS, "show:{$id}");
    }

    // ---- Retail inventory ----
    public static function retailInventory(bool $lowStockOnly): string
    {
        return self::build(self::RESOURCE_RETAIL_INVENTORY, 'index:'.($lowStockOnly ? '1' : '0'));
    }

    public static function retailMovements(int $variantId, int $page): string
    {
        return self::build(self::RESOURCE_RETAIL_INVENTORY, "movements:{$variantId}:{$page}");
    }

    // ---- Retail sales ----
    public static function retailSales(array $filters): string
    {
        return self::build(self::RESOURCE_RETAIL_SALES, 'index:'.md5(json_encode($filters)));
    }

    public static function retailSaleShow(int $id): string
    {
        return self::build(self::RESOURCE_RETAIL_SALES, "show:{$id}");
    }

    // ---- Retail dashboard ----
    public static function retailDashboard(): string
    {
        return self::build(self::RESOURCE_RETAIL_DASHBOARD);
    }
}
