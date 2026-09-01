<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreKarigarRequest;
use App\Http\Requests\UpdateKarigarRequest;
use App\Models\Karigar;
use App\Services\Cache\CacheBuster;
use App\Services\Cache\CacheKeys;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class KarigarController extends Controller
{
    public function __construct(private CacheBuster $cacheBuster)
    {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $karigars = Cache::remember(CacheKeys::karigars(), CacheKeys::KARIGAR_TTL, function () {
                return Karigar::query()
                    ->withCount(['orders as active_orders' => function ($query) {
                        $query->where('status', '!=', 'delivered');
                    }])
                    ->orderBy('name')
                    ->get();
            });

            return response()->json(['data' => $karigars]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function store(StoreKarigarRequest $request): JsonResponse
    {
        try {
            $karigar = Karigar::query()->create([
                'name' => $request->input('name'),
                'phone' => $request->input('phone'),
                'speciality' => $request->input('speciality'),
                'max_capacity' => $request->input('max_capacity', 6),
            ]);

            $this->cacheBuster->bustKarigars();

            return response()->json(['data' => $karigar, 'message' => 'Created successfully.'], 201);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $month = $request->query('month');

            $data = Cache::remember(CacheKeys::karigarShow($id, $month), CacheKeys::KARIGAR_TTL, function () use ($id, $month) {
                $karigar = Karigar::query()->find($id);

                if (! $karigar) {
                    return null;
                }

                $query = DB::table('orders')
                    ->join('customers', 'customers.id', '=', 'orders.customer_id')
                    // Bridged through each order's mirrored sales row — see
                    // OrderController::store()/update()/destroy().
                    ->leftJoin('sales', 'sales.legacy_order_id', '=', 'orders.id')
                    ->leftJoin('payments', 'payments.sale_id', '=', 'sales.id')
                    ->where('orders.karigar_id', $id);

                if ($month) {
                    $query->whereRaw("DATE_FORMAT(orders.assigned_date, '%Y-%m') = ?", [$month]);
                }

                $orders = $query
                    ->groupBy(
                        'orders.id', 'orders.order_no', 'orders.status', 'orders.deadline',
                        'orders.assigned_date', 'orders.delivered_date', 'orders.total_amount',
                        'customers.name'
                    )
                    ->orderByDesc('orders.assigned_date')
                    ->get([
                        'orders.id',
                        'orders.order_no',
                        'orders.status',
                        'orders.deadline',
                        'orders.assigned_date',
                        'orders.delivered_date',
                        'orders.total_amount',
                        'customers.name as customer_name',
                        DB::raw('COALESCE(SUM(payments.amount), 0) as paid_amount'),
                    ]);

                return [
                    'karigar' => $karigar,
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

    public function update(UpdateKarigarRequest $request, int $id): JsonResponse
    {
        try {
            $karigar = Karigar::query()->find($id);

            if (! $karigar) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $karigar->update([
                'name' => $request->input('name'),
                'phone' => $request->input('phone'),
                'speciality' => $request->input('speciality'),
                'max_capacity' => $request->input('max_capacity', $karigar->max_capacity),
            ]);

            $this->cacheBuster->bustKarigars();

            return response()->json(['data' => $karigar, 'message' => 'Updated successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $karigar = Karigar::query()->find($id);

            if (! $karigar) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $karigar->delete();

            $this->cacheBuster->bustKarigars();

            return response()->json(['message' => 'Deleted successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }
}
