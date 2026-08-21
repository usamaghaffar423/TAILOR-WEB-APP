<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Karigar;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Throwable;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $today = Carbon::today();
            $tomorrow = Carbon::tomorrow();
            $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY);
            $weekEnd = Carbon::now()->endOfWeek(Carbon::SUNDAY);

            $totalOrders = Order::query()->count();
            $newThisWeek = Order::query()->where('created_at', '>=', $weekStart)->count();
            $inProgress = Order::query()->where('status', 'progress')->count();
            $karigarCount = Order::query()->where('status', 'progress')->distinct('karigar_id')->count('karigar_id');
            $dueThisWeek = Order::query()
                ->whereBetween('deadline', [$today->toDateString(), $weekEnd->toDateString()])
                ->where('status', '!=', 'delivered')
                ->count();
            $dueTomorrow = Order::query()
                ->whereDate('deadline', $tomorrow->toDateString())
                ->where('status', '!=', 'delivered')
                ->count();

            $pendingPayments = $this->pendingPaymentsSummary();

            $recentOrders = Order::query()
                ->join('customers', 'customers.id', '=', 'orders.customer_id')
                ->orderByDesc('orders.created_at')
                ->limit(8)
                ->get([
                    'orders.id',
                    'orders.order_no',
                    'orders.status',
                    'orders.deadline',
                    'orders.total_amount',
                    'customers.name as customer_name',
                ]);

            $karigarWorkload = Karigar::query()
                ->withCount(['orders as active_orders' => function ($query) {
                    $query->where('status', '!=', 'delivered');
                }])
                ->get(['id', 'name', 'max_capacity'])
                ->map(fn (Karigar $karigar) => [
                    'id' => $karigar->id,
                    'name' => $karigar->name,
                    'activeOrders' => $karigar->active_orders,
                    'maxCapacity' => $karigar->max_capacity,
                ]);

            $deadlinesThisWeek = Order::query()
                ->join('customers', 'customers.id', '=', 'orders.customer_id')
                ->whereBetween('orders.deadline', [$today->toDateString(), $weekEnd->toDateString()])
                ->where('orders.status', '!=', 'delivered')
                ->orderBy('orders.deadline')
                ->get([
                    'orders.id',
                    'orders.order_no',
                    'orders.status',
                    'orders.deadline',
                    'customers.name as customer_name',
                ]);

            return response()->json([
                'data' => [
                    'kpis' => [
                        'totalOrders' => $totalOrders,
                        'newThisWeek' => $newThisWeek,
                        'inProgress' => $inProgress,
                        'karigarCount' => $karigarCount,
                        'dueThisWeek' => $dueThisWeek,
                        'dueTomorrow' => $dueTomorrow,
                        'pendingPayments' => $pendingPayments,
                    ],
                    'recentOrders' => $recentOrders,
                    'karigarWorkload' => $karigarWorkload,
                    'deadlinesThisWeek' => $deadlinesThisWeek,
                ],
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    private function pendingPaymentsSummary(): array
    {
        $rows = Order::query()
            ->where('orders.status', '!=', 'delivered')
            ->leftJoin('payments', 'payments.order_id', '=', 'orders.id')
            ->groupBy('orders.id', 'orders.total_amount')
            ->get([
                'orders.id',
                'orders.total_amount',
                DB::raw('COALESCE(SUM(payments.amount), 0) as paid_amount'),
            ]);

        $totalPending = 0;
        $orderCount = 0;

        foreach ($rows as $row) {
            $pending = (float) $row->total_amount - (float) $row->paid_amount;
            $totalPending += $pending;
            if ($pending > 0) {
                $orderCount++;
            }
        }

        return [
            'totalPending' => number_format($totalPending, 2, '.', ''),
            'orderCount' => $orderCount,
        ];
    }
}
