<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enum\User\UserType;
use App\Http\Controllers\Controller;
use App\Models\BusquedaProductoMostrado;
use App\Models\User;
use App\Models\UserLoginLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class AdminStatsController extends Controller
{
    /**
     * Categorías (grupos) más vistos en búsquedas - para gráfica de pastel.
     * Solo tiene datos cuando hay búsquedas registradas en busqueda_productos_mostrados.
     */
    public function categoriasMasVistas(): JsonResponse
    {
        $data = BusquedaProductoMostrado::query()
            ->join('productos_cva', 'busqueda_productos_mostrados.producto_clave', '=', 'productos_cva.clave')
            ->select(DB::raw("COALESCE(productos_cva.grupo, 'Sin categoría') as nombre"), DB::raw('COUNT(*) as total'))
            ->groupBy('productos_cva.grupo')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ], Response::HTTP_OK);
    }

    /**
     * Usuarios cliente registrados por mes (tabla users, tipo = cliente) - para gráfica lineal.
     */
    public function clientesPorMes(): JsonResponse
    {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'sqlsrv') {
            $dateExpr = "FORMAT(created_at, 'yyyy-MM')";
        } elseif ($driver === 'sqlite') {
            $dateExpr = "strftime('%Y-%m', created_at)";
        } else {
            $dateExpr = "DATE_FORMAT(created_at, '%Y-%m')";
        }

        $data = User::query()
            ->where('tipo', UserType::CUSTOMER->value)
            ->select(DB::raw("{$dateExpr} as mes"), DB::raw('COUNT(*) as total'))
            ->groupBy(DB::raw($dateExpr))
            ->orderBy('mes')
            ->limit(12)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ], Response::HTTP_OK);
    }

    /**
     * Actividad de usuarios: registros e inicios de sesión por mes, con desglose por tipo (admin, cliente, vendedor).
     */
    public function actividadUsuarios(): JsonResponse
    {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'sqlsrv') {
            $dateExpr = "FORMAT(created_at, 'yyyy-MM')";
            $dateExprLog = "FORMAT(logged_at, 'yyyy-MM')";
        } elseif ($driver === 'sqlite') {
            $dateExpr = "strftime('%Y-%m', created_at)";
            $dateExprLog = "strftime('%Y-%m', logged_at)";
        } else {
            $dateExpr = "DATE_FORMAT(created_at, '%Y-%m')";
            $dateExprLog = "DATE_FORMAT(logged_at, '%Y-%m')";
        }

        $registrosPorMes = User::query()
            ->select(
                DB::raw("{$dateExpr} as mes"),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN tipo = 1 THEN 1 ELSE 0 END) as admin'),
                DB::raw('SUM(CASE WHEN tipo = 2 THEN 1 ELSE 0 END) as cliente'),
                DB::raw('SUM(CASE WHEN tipo = 3 THEN 1 ELSE 0 END) as vendedor')
            )
            ->groupBy(DB::raw($dateExpr))
            ->orderBy('mes')
            ->limit(24)
            ->get();

        $loginsPorMes = collect();
        try {
            if (Schema::hasTable('user_login_log')) {
                $loginsPorMes = UserLoginLog::query()
                    ->select(
                        DB::raw("{$dateExprLog} as mes"),
                        DB::raw('COUNT(*) as total'),
                        DB::raw('SUM(CASE WHEN tipo = 1 THEN 1 ELSE 0 END) as admin'),
                        DB::raw('SUM(CASE WHEN tipo = 2 THEN 1 ELSE 0 END) as cliente'),
                        DB::raw('SUM(CASE WHEN tipo = 3 THEN 1 ELSE 0 END) as vendedor')
                    )
                    ->groupBy(DB::raw($dateExprLog))
                    ->orderBy('mes')
                    ->limit(24)
                    ->get();
            }
        } catch (\Throwable $e) {
            // Tabla aún no migrada o error de BD: logins vacíos
        }

        $meses = collect($registrosPorMes->pluck('mes'))
            ->merge($loginsPorMes->pluck('mes'))
            ->unique()
            ->sort()
            ->values()
            ->take(24)
            ->all();

        $registrosMap = $registrosPorMes->keyBy('mes');
        $loginsMap = $loginsPorMes->keyBy('mes');

        $data = [];
        foreach ($meses as $mes) {
            $r = $registrosMap->get($mes);
            $l = $loginsMap->get($mes);
            $data[] = [
                'mes' => $mes,
                'registros' => (int) ($r->total ?? 0),
                'registros_admin' => (int) ($r->admin ?? 0),
                'registros_cliente' => (int) ($r->cliente ?? 0),
                'registros_vendedor' => (int) ($r->vendedor ?? 0),
                'logins' => (int) ($l->total ?? 0),
                'logins_admin' => (int) ($l->admin ?? 0),
                'logins_cliente' => (int) ($l->cliente ?? 0),
                'logins_vendedor' => (int) ($l->vendedor ?? 0),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ], Response::HTTP_OK);
    }

    /**
     * Eventos de actividad por día y hora: cada registro y cada login con (dia del mes, hora).
     * Eje X = días (1-31), Eje Y = horas (0-23). Para gráfica de dispersión con movimiento.
     */
    public function actividadEventos(): JsonResponse
    {
        $desde = now()->subDays(31);

        $registros = User::query()
            ->where('created_at', '>=', $desde)
            ->get(['id', 'created_at', 'tipo'])
            ->map(fn ($u) => [
                'dia' => (int) $u->created_at->day,
                'hora' => (int) $u->created_at->hour,
                'tipo' => (int) $u->tipo->value,
                'evento' => 'registro',
            ]);

        $logins = collect();
        try {
            if (Schema::hasTable('user_login_log')) {
                $logins = UserLoginLog::query()
                    ->where('logged_at', '>=', $desde)
                    ->get(['id', 'logged_at', 'tipo'])
                    ->map(fn ($l) => [
                        'dia' => (int) $l->logged_at->day,
                        'hora' => (int) $l->logged_at->hour,
                        'tipo' => (int) $l->tipo,
                        'evento' => 'login',
                    ]);
            }
        } catch (\Throwable $e) {
        }

        $eventos = $registros->concat($logins)->values()->all();

        return response()->json([
            'success' => true,
            'data' => $eventos,
        ], Response::HTTP_OK);
    }
}
