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
                $query = Customer::query();

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
                    ->leftJoin('payments', 'payments.order_id', '=', 'orders.id')
                    ->where('orders.customer_id', $id)
                    ->groupBy(
                        'orders.id', 'orders.order_no', 'orders.status', 'orders.deadline',
                        'orders.assigned_date', 'orders.delivered_date', 'orders.total_amount',
                        'karigars.name'
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
                        'karigars.name as karigar_name',
                        DB::raw('COALESCE(SUM(payments.amount), 0) as paid_amount'),
                    ]);

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

    private function nextCustomerId(): string
    {
        $max = DB::table('customers')
            ->selectRaw("MAX(CAST(SUBSTRING(customer_id, 5) AS UNSIGNED)) as max_num")
            ->value('max_num');

        $next = ((int) $max) + 1;

        return 'TMT-'.str_pad((string) $next, 3, '0', STR_PAD_LEFT);
    }
}
