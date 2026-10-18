<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Http\Requests\UpsertMeasurementRequest;
use App\Models\Customer;
use App\Models\Measurement;
use App\Services\Cache\CacheBuster;
use App\Services\Cache\CacheKeys;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class CustomerController extends Controller
{
    public function __construct(private CacheBuster $cacheBuster)
    {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $q = $request->query('q');

            $customers = Cache::remember(CacheKeys::customers($q), CacheKeys::CUSTOMERS_TTL, function () use ($q) {
                $query = Customer::query()
                    ->selectRaw('customers.*, (select count(*) from orders where orders.customer_id = customers.id) as total_orders')
                    ->selectRaw('(select max(orders.created_at) from orders where orders.customer_id = customers.id) as last_order_date')
                    // Financial aggregates for the outstanding-balance badge on
                    // each customer card. Same SQL fragments the show()/summary
                    // path uses, so the list and the profile always agree.
                    ->selectRaw(Customer::FINANCIAL_SELECT_SQL['total_spent'].' as total_spent')
                    ->selectRaw(Customer::FINANCIAL_SELECT_SQL['total_paid'].' as total_paid')
                    ->selectRaw('('.Customer::FINANCIAL_SELECT_SQL['total_spent'].' - '.Customer::FINANCIAL_SELECT_SQL['total_paid'].') as total_unpaid_balance');

                if ($q) {
                    $query->where(function ($sub) use ($q) {
                        $sub->where('name', 'like', "%{$q}%")
                            ->orWhere('phone', 'like', "%{$q}%")
                            ->orWhere('customer_id', 'like', "%{$q}%");
                    });
                }

                return $query->orderByDesc('id')->get();
            });

            return response()->json(['data' => $customers]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        try {
            // Always create a new customer record — multiple people (e.g.
            // family members) may share the same phone number and each
            // needs their own record with their own name/measurements.
            $customer = Customer::query()->create([
                'customer_id' => $this->nextCustomerId(),
                'name' => $request->input('name'),
                'phone' => $request->input('phone'),
                'address' => $request->input('address'),
            ]);

            $this->cacheBuster->bustCustomers();

            return response()->json(['data' => $customer, 'message' => 'Created successfully.'], 201);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $data = Cache::remember(CacheKeys::customerShow($id), CacheKeys::CUSTOMERS_TTL, function () use ($id) {
                $customer = Customer::query()->find($id);

                if (! $customer) {
                    return null;
                }

                $measurements = Measurement::query()->where('customer_id', $id)->get();

                $orders = DB::table('orders')
                    ->join('karigars', 'karigars.id', '=', 'orders.karigar_id')
                    // Bridged through each order's mirrored sales row — see
                    // OrderController::store()/update()/destroy().
                    ->leftJoin('sales', 'sales.legacy_order_id', '=', 'orders.id')
                    ->leftJoin('payments', 'payments.sale_id', '=', 'sales.id')
                    ->where('orders.customer_id', $id)
                    ->groupBy(
                        'orders.id', 'orders.order_no', 'orders.status', 'orders.deadline',
                        'orders.assigned_date', 'orders.delivered_date', 'orders.total_amount',
                        'orders.style', 'orders.items', 'orders.karigar_id', 'karigars.name'
                    )
                    ->orderByDesc('orders.created_at')
                    ->get([
                        'orders.id',
                        'orders.order_no',
                        'orders.status',
                        'orders.deadline',
                        'orders.assigned_date',
                        'orders.delivered_date',
                        'orders.total_amount',
                        'orders.style',
                        'orders.items',
                        'orders.karigar_id',
                        'karigars.name as karigar_name',
                        DB::raw('COALESCE(SUM(payments.amount), 0) as paid_amount'),
                    ]);

                $orders->each(function ($o) {
                    $o->style = is_string($o->style) ? json_decode($o->style, true) : $o->style;
                    $o->items = is_string($o->items) ? json_decode($o->items, true) : $o->items;
                });

                // Account-level totals so the profile shows the whole
                // outstanding debt, not just a number the client summed from
                // whatever page of orders it happens to hold.
                $customer->loadFinancials();

                return [
                    'customer' => $customer,
                    'measurements' => $measurements,
                    'orders' => $orders,
                ];
            });

            if (! $data) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            return response()->json(['data' => $data]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function update(UpdateCustomerRequest $request, int $id): JsonResponse
    {
        try {
            $customer = Customer::query()->find($id);

            if (! $customer) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $customer->update([
                'name' => $request->input('name'),
                'phone' => $request->input('phone'),
                'address' => $request->input('address'),
            ]);

            $this->cacheBuster->bustCustomers();

            return response()->json(['data' => $customer, 'message' => 'Updated successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function getMeasurements(Request $request, int $id): JsonResponse
    {
        try {
            $customer = Customer::query()->find($id);

            if (! $customer) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $measurements = Cache::remember(
                CacheKeys::customerMeasurements($id),
                CacheKeys::CUSTOMERS_TTL,
                fn () => Measurement::query()->where('customer_id', $id)->get()
            );

            return response()->json(['data' => $measurements]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    /**
     * GET /api/customers/{id}/measurements/latest — the customer's most
     * recently updated measurement profile, for pre-filling the New Order
     * form the moment an existing customer is picked.
     */
    public function latestMeasurement(Request $request, int $id): JsonResponse
    {
        try {
            $customer = Customer::query()->find($id);

            if (! $customer) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $measurements = Cache::remember(
                CacheKeys::customerMeasurements($id),
                CacheKeys::CUSTOMERS_TTL,
                fn () => Measurement::query()->where('customer_id', $id)->get()
            );

            $latest = $measurements->sortByDesc('updated_at')->first();

            return response()->json(['data' => $latest]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function upsertMeasurement(UpsertMeasurementRequest $request, int $id, string $templateKey): JsonResponse
    {
        try {
            $measurement = Measurement::query()->updateOrCreate(
                ['customer_id' => $id, 'template_key' => $templateKey],
                [
                    'fields' => $request->input('fields'),
                    'notes' => $request->input('notes'),
                ]
            );

            $this->cacheBuster->bustCustomers();

            return response()->json(['data' => $measurement, 'message' => 'Saved successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $customer = Customer::query()->find($id);

            if (! $customer) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $orderCount = DB::table('orders')->where('customer_id', $id)->count();

            if ($orderCount > 0) {
                return response()->json([
                    'message' => "Can't delete — this customer has {$orderCount} order(s) on record. Reassign or remove those orders first.",
                ], 422);
            }

            $customer->delete();

            $this->cacheBuster->bustCustomers();

            return response()->json(['message' => 'Deleted successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    private function nextCustomerId(): string
    {
        $max = DB::table('customers')
            ->selectRaw("MAX(CAST(SUBSTRING(customer_id, 5) AS UNSIGNED)) as max_num")
            ->value('max_num');

        $next = ((int) $max) + 1;

        return 'TMT-'.str_pad((string) $next, 3, '0', STR_PAD_LEFT);
    }
}
