<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Customer extends Model
{
    protected $fillable = [
        'customer_id',
        'name',
        'phone',
        'address',
    ];

    /**
     * SQL fragments for a customer's account financials, shared by the list
     * (index) and single (show/summary) paths so the numbers can never drift
     * between endpoints.
     *
     * total_spent  = sum of every order's total_amount
     * total_paid   = sum of every payment recorded against the customer's
     *                orders (payments bridge through the order's mirror sale)
     * total_unpaid = total_spent - total_paid (the whole outstanding debt
     *                across all their orders)
     */
    public const FINANCIAL_SELECT_SQL = [
        'total_spent' => '(select COALESCE(sum(orders.total_amount), 0) from orders where orders.customer_id = customers.id)',
        // Payments reach a customer through their order's mirror sale
        // (sales.legacy_order_id -> orders.customer_id) or, for retail sales,
        // through sales.customer_id directly. coalesce() covers both, and the
        // left join tolerates backfilled mirror sales whose customer_id is NULL.
        'total_paid' => '(select COALESCE(sum(payments.amount), 0) from payments join sales on sales.id = payments.sale_id left join orders on orders.id = sales.legacy_order_id where COALESCE(orders.customer_id, sales.customer_id) = customers.id)',
    ];

    public function measurements(): HasMany
    {
        return $this->hasMany(Measurement::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Attach the three financial aggregates (as attributes) to a customer
     * model that was NOT selected with the FINANCIAL_SELECT_SQL fragments
     * (e.g. one loaded via find() elsewhere). Computed in one query.
     */
    public function loadFinancials(): static
    {
        $row = DB::table('customers')
            ->where('id', $this->id)
            ->select([
                DB::raw(self::FINANCIAL_SELECT_SQL['total_spent'].' as total_spent'),
                DB::raw(self::FINANCIAL_SELECT_SQL['total_paid'].' as total_paid'),
            ])
            ->first();

        $spent = (float) ($row->total_spent ?? 0);
        $paid = (float) ($row->total_paid ?? 0);

        $this->setRawAttributes(array_merge($this->getAttributes(), [
            'total_spent' => number_format($spent, 2, '.', ''),
            'total_paid' => number_format($paid, 2, '.', ''),
            'total_unpaid_balance' => number_format($spent - $paid, 2, '.', ''),
        ]), true);

        return $this;
    }

    /**
     * Per-customer financial summary for one customer id. Returns the three
     * totals as number_format-ed strings, matching the shape the frontend
     * CustomerFinancials type expects.
     */
    public static function financialSummary(int $customerId): array
    {
        $row = DB::table('customers')
            ->where('id', $customerId)
            ->select([
                DB::raw(self::FINANCIAL_SELECT_SQL['total_spent'].' as total_spent'),
                DB::raw(self::FINANCIAL_SELECT_SQL['total_paid'].' as total_paid'),
            ])
            ->first();

        $spent = (float) ($row->total_spent ?? 0);
        $paid = (float) ($row->total_paid ?? 0);

        return [
            'total_spent' => number_format($spent, 2, '.', ''),
            'total_paid' => number_format($paid, 2, '.', ''),
            'total_unpaid_balance' => number_format($spent - $paid, 2, '.', ''),
        ];
    }
}
