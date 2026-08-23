<?php

namespace App\Services\Cache;

use Illuminate\Support\Facades\Cache;

/**
 * The only place cache invalidation happens. Controllers call a bust*()
 * method after a write succeeds — never Cache::forget() directly — so the
 * dependency graph between resources lives in one place.
 *
 * Each bust*() also chains to whatever OTHER cached resource embeds data
 * that just changed (e.g. a karigar rename invalidates cached order
 * listings too, since those cache entries embed karigars.name from a
 * JOIN). That chaining is deliberate — see the comment on each method.
 */
class CacheBuster
{
    public function bustDashboard(): void
    {
        $this->bump(CacheKeys::RESOURCE_DASHBOARD);
    }

    public function bustOrders(): void
    {
        $this->bump(CacheKeys::RESOURCE_ORDERS);
        // Dashboard KPIs/recent orders/deadlines/workload all derive from orders.
        $this->bustDashboard();
    }

    public function bustCustomers(): void
    {
        $this->bump(CacheKeys::RESOURCE_CUSTOMERS);
    }

    public function bustKarigars(): void
    {
        $this->bump(CacheKeys::RESOURCE_KARIGARS);
        // Cached order listings/detail embed karigars.name via JOIN/relation.
        $this->bustOrders();
    }

    public function bustPayments(): void
    {
        $this->bump(CacheKeys::RESOURCE_PAYMENTS);
        // Cached order listings embed a paid_amount SUM, and cached order
        // show() eager-loads the payments relation directly.
        $this->bustOrders();
    }

    public function bustSettings(): void
    {
        $this->bump(CacheKeys::RESOURCE_SETTINGS);
    }

    public function bustTemplates(): void
    {
        $this->bump(CacheKeys::RESOURCE_TEMPLATES);
    }

    public function bustRetailProducts(): void
    {
        $this->bump(CacheKeys::RESOURCE_RETAIL_PRODUCTS);
    }

    public function bustRetailInventory(): void
    {
        $this->bump(CacheKeys::RESOURCE_RETAIL_INVENTORY);
        // Product index/show eager-load variants.inventory and embed
        // sale_price, both of which just changed.
        $this->bustRetailProducts();
        $this->bustRetailDashboard();
    }

    public function bustRetailSales(): void
    {
        $this->bump(CacheKeys::RESOURCE_RETAIL_SALES);
        // Revenue, top products, payment breakdown all derive from sales.
        $this->bustRetailDashboard();
    }

    public function bustRetailDashboard(): void
    {
        $this->bump(CacheKeys::RESOURCE_RETAIL_DASHBOARD);
    }

    /**
     * Bump a resource's version number. Every cache key previously built
     * for it (CacheKeys::build()) embedded the old version, so it's now
     * unreachable — the file cache driver has no tag support to do this
     * more directly, but nothing ever reads those old entries again, and
     * they fall out of the cache naturally when their TTL elapses.
     */
    private function bump(string $resource): void
    {
        $key = CacheKeys::versionKey($resource);
        Cache::forever($key, ((int) Cache::get($key, 1)) + 1);
    }
}
