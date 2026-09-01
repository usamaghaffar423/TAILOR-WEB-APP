<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentRequest;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Sale;
use App\Services\Cache\CacheBuster;
use App\Services\Cache\CacheKeys;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class PaymentController extends Controller
{
    public function __construct(private CacheBuster $cacheBuster)
    {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'method' => $request->query('method'),
                'from' => $request->query('from'),
                'to' => $request->query('to'),
                'q' => $request->query('q'),
            ];

            $payments = Cache::remember(CacheKeys::payments($filters), CacheKeys::PAYMENTS_TTL, function () use ($filters) {
                // payments now hangs off sales, not orders directly — bridge
                // through each order's mirrored sales row (see
                // OrderController::store()/update()/destroy() and
                // Order::payments()) so every payment recorded against the
                // still-live legacy Order Studio flow keeps resolving here.
                $query = DB::table('payments')
                    ->join('sales', 'sales.id', '=', 'payments.sale_id')
                    ->join('orders', 'orders.id', '=', 'sales.legacy_order_id')
                    ->join('customers', 'customers.id', '=', 'orders.customer_id');

                if ($filters['method']) {
                    $query->where('payments.method', $filters['method']);
                }

                if ($filters['from']) {
                    $query->whereDate('payments.date', '>=', $filters['from']);
                }

                if ($filters['to']) {
                    $query->whereDate('payments.date', '<=', $filters['to']);
                }

                if ($filters['q']) {
                    $q = $filters['q'];
                    $query->where(function ($sub) use ($q) {
                        $sub->where('orders.order_no', 'like', "%{$q}%")
                            ->orWhere('customers.name', 'like', "%{$q}%");
                    });
                }

                return $query
                    ->orderByDesc('payments.date')
                    ->orderByDesc('payments.id')
                    ->get([
                        'payments.id',
                        'payments.amount',
                        'payments.method',
                        'payments.date',
                        'payments.note',
                        'orders.id as order_id',
                        'orders.order_no',
                        'customers.name as customer_name',
                    ]);
            });

            return response()->json(['data' => $payments]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function store(StorePaymentRequest $request): JsonResponse
    {
        try {
            $order = Order::query()->find($request->input('order_id'));

            // Every order (backfilled or created via the still-live legacy
            // flow) has exactly one mirrored sales row to bridge through —
            // see OrderController::store(). If one is somehow missing,
            // create it now rather than failing the payment outright.
            $sale = Sale::query()->firstOrCreate(
                ['legacy_order_id' => $order->id],
                [
                    'customer_id' => $order->customer_id,
                    'subtotal' => $order->total_amount,
                    'total' => $order->total_amount,
                    'status' => 'in_progress',
                ]
            );

            $payment = Payment::query()->create([
                'sale_id' => $sale->id,
                'amount' => $request->input('amount'),
                'method' => $request->input('method'),
                'date' => $request->input('date'),
                'note' => $request->input('note'),
            ]);

            $paidAmount = Payment::query()->where('sale_id', $sale->id)->sum('amount');

            $this->cacheBuster->bustPayments();

            return response()->json([
                'data' => [
                    'payment' => $payment,
                    'order' => [
                        'id' => $order->id,
                        'order_no' => $order->order_no,
                        'total_amount' => $order->total_amount,
                        'paid_amount' => number_format((float) $paidAmount, 2, '.', ''),
                        'pending_amount' => number_format((float) $order->total_amount - (float) $paidAmount, 2, '.', ''),
                    ],
                ],
                'message' => 'Payment recorded successfully.',
            ], 201);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function summary(Request $request): JsonResponse
    {
        try {
            $data = Cache::remember(CacheKeys::paymentsSummary(), CacheKeys::PAYMENTS_TTL, function () {
                $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY);
                $monthStart = Carbon::now()->startOfMonth();

                $thisWeek = Payment::query()->where('date', '>=', $weekStart->toDateString())->sum('amount');
                $thisMonth = Payment::query()->where('date', '>=', $monthStart->toDateString())->sum('amount');
                $allTime = Payment::query()->sum('amount');

                $rows = Order::query()
                    ->where('orders.status', '!=', 'delivered')
                    ->leftJoin('sales', 'sales.legacy_order_id', '=', 'orders.id')
                    ->leftJoin('payments', 'payments.sale_id', '=', 'sales.id')
                    ->groupBy('orders.id', 'orders.total_amount')
                    ->get([
                        'orders.id',
                        'orders.total_amount',
                        DB::raw('COALESCE(SUM(payments.amount), 0) as paid_amount'),
                    ]);

                $totalPending = 0;
                foreach ($rows as $row) {
                    $totalPending += (float) $row->total_amount - (float) $row->paid_amount;
                }

                return [
                    'thisWeek' => number_format((float) $thisWeek, 2, '.', ''),
                    'thisMonth' => number_format((float) $thisMonth, 2, '.', ''),
                    'allTime' => number_format((float) $allTime, 2, '.', ''),
                    'totalPending' => number_format($totalPending, 2, '.', ''),
                ];
            });

            return response()->json(['data' => $data]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function balances(Request $request): JsonResponse
    {
        try {
            $balances = Cache::remember(CacheKeys::paymentsBalances(), CacheKeys::PAYMENTS_TTL, function () {
                $rows = DB::table('orders')
                    ->join('customers', 'customers.id', '=', 'orders.customer_id')
                    ->join('karigars', 'karigars.id', '=', 'orders.karigar_id')
                    ->leftJoin('sales', 'sales.legacy_order_id', '=', 'orders.id')
                    ->leftJoin('payments', 'payments.sale_id', '=', 'sales.id')
                    ->groupBy(
                        'orders.id', 'orders.order_no', 'orders.status', 'orders.deadline',
                        'orders.total_amount', 'customers.name', 'karigars.name'
                    )
                    ->orderBy('orders.deadline')
                    ->get([
                        'orders.id',
                        'orders.order_no',
                        'orders.status',
                        'orders.deadline',
                        'orders.total_amount',
                        'customers.name as customer_name',
                        'karigars.name as karigar_name',
                        DB::raw('COALESCE(SUM(payments.amount), 0) as paid_amount'),
                    ]);

                return $rows
                    ->map(function ($row) {
                        $pending = (float) $row->total_amount - (float) $row->paid_amount;

                        return [
                            'id' => $row->id,
                            'order_no' => $row->order_no,
                            'status' => $row->status,
                            'deadline' => $row->deadline,
                            'total_amount' => $row->total_amount,
                            'paid_amount' => number_format((float) $row->paid_amount, 2, '.', ''),
                            'pending_amount' => number_format($pending, 2, '.', ''),
                            'customer_name' => $row->customer_name,
                            'karigar_name' => $row->karigar_name,
                        ];
                    })
                    ->filter(fn ($row) => (float) $row['pending_amount'] > 0)
                    ->values();
            });

            return response()->json(['data' => $balances]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }
}
