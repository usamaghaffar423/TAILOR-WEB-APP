<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Models\Measurement;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Throwable;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DB::table('orders')
                ->join('customers', 'customers.id', '=', 'orders.customer_id')
                ->join('karigars', 'karigars.id', '=', 'orders.karigar_id')
                ->leftJoin('payments', 'payments.order_id', '=', 'orders.id');

            if ($status = $request->query('status')) {
                $query->where('orders.status', $status);
            }

            if ($karigarId = $request->query('karigar_id')) {
                $query->where('orders.karigar_id', $karigarId);
            }

            if ($q = $request->query('q')) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('orders.order_no', 'like', "%{$q}%")
                        ->orWhere('customers.name', 'like', "%{$q}%");
                });
            }

            if ($from = $request->query('from')) {
                $query->whereDate('orders.deadline', '>=', $from);
            }

            if ($to = $request->query('to')) {
                $query->whereDate('orders.deadline', '<=', $to);
            }

            $orders = $query
                ->groupBy(
                    'orders.id', 'orders.order_no', 'orders.status', 'orders.deadline',
                    'orders.assigned_date', 'orders.delivered_date', 'orders.total_amount',
                    'orders.created_at', 'customers.id', 'customers.name', 'customers.phone',
                    'karigars.id', 'karigars.name'
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
                    'customers.id as customer_id',
                    'customers.name as customer_name',
                    'customers.phone as customer_phone',
                    'karigars.id as karigar_id',
                    'karigars.name as karigar_name',
                    DB::raw('COALESCE(SUM(payments.amount), 0) as paid_amount'),
                ]);

            return response()->json(['data' => $orders]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        try {
            $measurement = Measurement::query()
                ->where('customer_id', $request->input('customer_id'))
                ->where('template_key', $request->input('template_key'))
                ->first();

            $order = Order::query()->create([
                'order_no' => $this->nextOrderNo(),
                'customer_id' => $request->input('customer_id'),
                'style' => $request->input('style'),
                'measurement_snapshot' => $measurement?->fields ?? [],
                'karigar_id' => $request->input('karigar_id'),
                'assigned_date' => Carbon::today()->toDateString(),
                'deadline' => $request->input('deadline'),
                'status' => $request->input('status', 'progress'),
                'total_amount' => $request->input('total_amount'),
            ]);

            $advanceAmount = $request->input('advance_amount');
            if ($advanceAmount && (float) $advanceAmount > 0) {
                Payment::query()->create([
                    'order_id' => $order->id,
                    'amount' => $advanceAmount,
                    'method' => $request->input('advance_method'),
                    'date' => $request->input('advance_date', Carbon::today()->toDateString()),
                    'note' => $request->input('advance_note'),
                ]);
            }

            $order->load(['customer', 'karigar', 'photos', 'payments']);

            return response()->json(['data' => $order, 'message' => 'Created successfully.'], 201);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $order = Order::query()->with(['customer', 'karigar', 'photos', 'payments'])->find($id);

            if (! $order) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            return response()->json(['data' => $order]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function updateStatus(UpdateOrderStatusRequest $request, int $id): JsonResponse
    {
        try {
            $order = Order::query()->find($id);

            if (! $order) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $status = $request->input('status');

            $order->status = $status;
            $order->delivered_date = $status === 'delivered' ? Carbon::today()->toDateString() : null;
            $order->save();

            return response()->json(['data' => $order, 'message' => 'Status updated successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function update(UpdateOrderRequest $request, int $id): JsonResponse
    {
        try {
            $order = Order::query()->find($id);

            if (! $order) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $status = $request->input('status');

            $order->karigar_id = $request->input('karigar_id');
            $order->deadline = $request->input('deadline');
            $order->status = $status;
            $order->total_amount = $request->input('total_amount');
            $order->delivered_date = $status === 'delivered'
                ? ($order->delivered_date ?? Carbon::today()->toDateString())
                : null;
            $order->save();

            return response()->json(['data' => $order, 'message' => 'Updated successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $order = Order::query()->find($id);

            if (! $order) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $order->delete();

            return response()->json(['message' => 'Deleted successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    private function nextOrderNo(): string
    {
        $max = DB::table('orders')
            ->selectRaw("MAX(CAST(SUBSTRING(order_no, 5) AS UNSIGNED)) as max_num")
            ->value('max_num');

        $next = ((int) $max) + 1;

        return 'ORD-'.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
