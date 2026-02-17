<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Spatie\Permission\Exceptions\UnauthorizedException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        // API con token sin CSRF; SPA con cookies sí usa CSRF
        $middleware->validateCsrfTokens(except: [
            'api/v1/auth/*',
            'api/v1/admin/auth/*',
            'api/v1/admin/*',
            'api/v1/user/*',
            'api/v1/prueba-pedido',
            'api/v1/pedidos/*',
            'api/v1/direcciones-envio',
            'api/v1/direcciones-envio/*',
            'api/v1/datos-facturacion',
            'api/v1/datos-facturacion/*',
            'api/v1/carrito',
            'api/v1/carrito/*',
            'api/v1/cotizaciones',
            'api/v1/cotizaciones/*',
            'api/v1/favoritos',
            'api/v1/favoritos/*',
            'api/v1/tarjetas-guardadas',
            'api/v1/tarjetas-guardadas/*',
        ]);
        
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (UnauthorizedException $e, Request $request) {
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'No tienes permisos para acceder a este recurso.',
                'error' => 'Unauthorized'
            ], 403);
        }
        });
    })->create();
