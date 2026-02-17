<?php

use App\Http\Controllers\Api\V1\Admin\AdminAuthController;
use App\Http\Controllers\Api\V1\Admin\AdminStatsController;
use App\Http\Controllers\Api\V1\Admin\ManagerUserController;
use App\Http\Controllers\Api\V1\Admin\ProductoManualAdminController;
use App\Http\Controllers\Api\V1\Admin\PedidoAdminController;
use App\Http\Controllers\Api\V1\Admin\PublicidadAdminController;
use App\Http\Controllers\Api\V1\Auth\AuthController as ApiAuthController;
use App\Http\Controllers\Api\V1\BusquedaController;
use App\Http\Controllers\Api\V1\CarritoController;
use App\Http\Controllers\Api\V1\CotizacionController;
use App\Http\Controllers\Api\V1\Client\ClientController;
use App\Http\Controllers\Api\V1\DatoFacturacionController;
use App\Http\Controllers\Api\V1\DireccionEnvioController;
use App\Http\Controllers\Api\V1\FavoritoController;
use App\Http\Controllers\Api\V1\PedidoController;
use App\Http\Controllers\Api\V1\ProductoController;
use App\Http\Controllers\Api\V1\PublicidadController;
use App\Http\Controllers\Api\V1\PruebaPedidoController;
use App\Http\Controllers\Api\V1\TarjetaGuardadaController;
use App\Http\Controllers\Spa\Auth\AuthController as SpaAuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Admin auth (público - solo crea/admin login)
    Route::prefix('admin/auth')->group(function () {
        Route::post('/register', [AdminAuthController::class, 'register'])->name('admin.auth.register');
        Route::post('/token', [AdminAuthController::class, 'token'])->name('admin.auth.token');
    });

    //public routes here ------------------------
        //token
        Route::post('/auth/register', [ApiAuthController::class, 'register'])->name('auth.register')->middleware('guest');
        Route::post('/auth/token', [ApiAuthController::class, 'generateToken'])->name('auth.token')->middleware('guest');

        //cookie
        Route::prefix('spa')->group(function () {
            Route::post('/auth/register', [SpaAuthController::class, 'register'])->name('spa.auth.register')->middleware('guest');
            Route::post('/auth/login', [SpaAuthController::class, 'login'])->name('spa.auth.login')->middleware('guest');

        });

        // Catálogo CVA (productos) - público
        Route::get('/productos/estado', [ProductoController::class, 'estado'])->name('productos.estado');
        Route::get('/productos/destacados', [ProductoController::class, 'destacados'])->name('productos.destacados');
        Route::get('/productos/ultimos', [ProductoController::class, 'ultimos'])->name('productos.ultimos');
        Route::get('/productos/por-claves', [ProductoController::class, 'porClaves'])->name('productos.porClaves');
        Route::get('/productos/recomendados', [ProductoController::class, 'recomendados'])->name('productos.recomendados');
        Route::get('/productos', [ProductoController::class, 'index'])->name('productos.index');
        Route::get('/productos/{clave}', [ProductoController::class, 'show'])->name('productos.show');
        Route::get('/catalogos/categorias-principales', [ProductoController::class, 'categoriasPrincipales'])->name('catalogos.categoriasPrincipales');
        Route::get('/catalogos/grupos', [ProductoController::class, 'grupos'])->name('catalogos.grupos');
        Route::get('/catalogos/subgrupos', [ProductoController::class, 'subgrupos'])->name('catalogos.subgrupos');
        Route::get('/catalogos/marcas', [ProductoController::class, 'marcas'])->name('catalogos.marcas');

        // Búsqueda + registro de búsqueda/productos mostrados
        Route::get('/busqueda', [BusquedaController::class, 'index'])->name('busqueda.index');
        Route::post('/busqueda/seleccion', [BusquedaController::class, 'registrarSeleccion'])->name('busqueda.seleccion');

        // Publicidad (carrusel) - público
        Route::get('/publicidad', [PublicidadController::class, 'index'])->name('publicidad.index');
    //-------------------------------------------------------------

    //protected routes here
    Route::middleware('auth:sanctum')->group(function () {
        //API Routes---------------------------
        Route::get('/auth/profile', [ApiAuthController::class, 'profile'])->middleware(['permission:view profile'])->name('auth.profile');

        Route::post('/auth/revoke-tokens', [ApiAuthController::class, 'revokeTokens'])->name('auth.revoke.tokens');

        Route::put('/auth/profile/update', [ApiAuthController::class, 'updateProfile'])->middleware(['permission:edit profile'])->name('auth.profile.update');

        Route::put('/auth/password', [ApiAuthController::class, 'changePassword'])->middleware(['permission:edit profile'])->name('auth.password.update');

        //SPA Routes - COOKIES ----------------------
        Route::prefix('spa')->group(function () {

            Route::post('/auth/logout', [SpaAuthController::class, 'logout'])->name('spa.auth.logout');

            Route::put('/auth/profile/update', [SpaAuthController::class, 'updateProfile'])->middleware(['permission:edit profile'])->name('spa.auth.profile.update');
        });

        Route::middleware('role:customer')->group(function(){
            //GENERAL ROUTES FOR AUTHENTICATED USERS HERE --------------------------
            Route::post('/user/client/register',[ClientController::class,'registerClientByAuthUser'])->name('user.client.register');
            Route::get('/user/client/my',[ClientController::class,'getClientAuth'])->name('user.client.my');
            Route::put('/user/client/update/my',[ClientController::class,'update'])->name('user.client.update.my');

            Route::get('/pedidos', [PedidoController::class, 'index'])->middleware(['permission:view orders'])->name('pedidos.index');
            Route::get('/pedidos/papelera', [PedidoController::class, 'papelera'])->middleware(['permission:view orders'])->name('pedidos.papelera');
            Route::get('/pedidos/{id}', [PedidoController::class, 'show'])->middleware(['permission:view orders'])->name('pedidos.show');
            Route::get('/pedidos/{id}/pdf', [PedidoController::class, 'downloadPdf'])->middleware(['permission:view orders'])->name('pedidos.pdf');
            Route::delete('/pedidos/{id}', [PedidoController::class, 'destroy'])->middleware(['permission:view orders'])->name('pedidos.destroy');
            Route::post('/pedidos/{id}/restore', [PedidoController::class, 'restore'])->middleware(['permission:view orders'])->name('pedidos.restore');

            Route::post('/prueba-pedido', [PruebaPedidoController::class, 'store'])->middleware(['permission:view orders'])->name('prueba.pedido.store');

            Route::get('/carrito', [CarritoController::class, 'index'])->name('carrito.index');
            Route::post('/carrito', [CarritoController::class, 'store'])->name('carrito.store');
            Route::delete('/carrito/items/{clave}', [CarritoController::class, 'destroy'])->name('carrito.destroy');
            Route::post('/carrito/checkout', [CarritoController::class, 'checkout'])->name('carrito.checkout');

            Route::get('/favoritos', [FavoritoController::class, 'index'])->name('favoritos.index');
            Route::post('/favoritos', [FavoritoController::class, 'store'])->name('favoritos.store');
            Route::delete('/favoritos/items/{clave}', [FavoritoController::class, 'destroy'])->name('favoritos.destroy');

            Route::get('/direcciones-envio', [DireccionEnvioController::class, 'index'])->name('direcciones-envio.index');
            Route::post('/direcciones-envio', [DireccionEnvioController::class, 'store'])->name('direcciones-envio.store');
            Route::put('/direcciones-envio/{id}', [DireccionEnvioController::class, 'update'])->name('direcciones-envio.update');
            Route::delete('/direcciones-envio/{id}', [DireccionEnvioController::class, 'destroy'])->name('direcciones-envio.destroy');

            Route::get('/datos-facturacion', [DatoFacturacionController::class, 'index'])->name('datos-facturacion.index');
            Route::post('/datos-facturacion', [DatoFacturacionController::class, 'store'])->name('datos-facturacion.store');
            Route::put('/datos-facturacion/{id}', [DatoFacturacionController::class, 'update'])->name('datos-facturacion.update');
            Route::delete('/datos-facturacion/{id}', [DatoFacturacionController::class, 'destroy'])->name('datos-facturacion.destroy');

            Route::get('/cotizaciones', [CotizacionController::class, 'index'])->name('cotizaciones.index');
            Route::post('/cotizaciones', [CotizacionController::class, 'store'])->name('cotizaciones.store');
            Route::get('/cotizaciones/papelera', [CotizacionController::class, 'papelera'])->name('cotizaciones.papelera');
            Route::get('/cotizaciones/{id}', [CotizacionController::class, 'show'])->name('cotizaciones.show');
            Route::put('/cotizaciones/{id}', [CotizacionController::class, 'update'])->name('cotizaciones.update');
            Route::delete('/cotizaciones/{id}', [CotizacionController::class, 'destroy'])->name('cotizaciones.destroy');
            Route::post('/cotizaciones/{id}/restore', [CotizacionController::class, 'restore'])->name('cotizaciones.restore');

            Route::get('/tarjetas-guardadas', [TarjetaGuardadaController::class, 'index'])->name('tarjetas-guardadas.index');
            Route::post('/tarjetas-guardadas', [TarjetaGuardadaController::class, 'store'])->name('tarjetas-guardadas.store');
            Route::put('/tarjetas-guardadas/{id}', [TarjetaGuardadaController::class, 'update'])->name('tarjetas-guardadas.update');
            Route::delete('/tarjetas-guardadas/{id}', [TarjetaGuardadaController::class, 'destroy'])->name('tarjetas-guardadas.destroy');
        });

        // Admin routes (solo usuarios con rol admin)
        Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
            Route::get('/stats/categorias-mas-vistas', [AdminStatsController::class, 'categoriasMasVistas'])->name('stats.categorias');
            Route::get('/stats/clientes-por-mes', [AdminStatsController::class, 'clientesPorMes'])->name('stats.clientes');
            Route::get('/stats/actividad-usuarios', [AdminStatsController::class, 'actividadUsuarios'])->name('stats.actividad');
            Route::get('/stats/actividad-eventos', [AdminStatsController::class, 'actividadEventos'])->name('stats.actividad.eventos');

            Route::get('/tipos-usuario', [ManagerUserController::class, 'getTypesUser'])->name('tipos-usuario');
            Route::get('/permisos', [ManagerUserController::class, 'getPermissions'])->name('permisos');

            Route::get('/usuarios', [ManagerUserController::class, 'index'])->name('usuarios.index');
            Route::post('/usuarios', [ManagerUserController::class, 'store'])->name('usuarios.store');
            Route::put('/usuarios/{usuarioId}', [ManagerUserController::class, 'update'])->name('usuarios.update');
            Route::delete('/usuarios/{usuarioId}', [ManagerUserController::class, 'destroy'])->name('usuarios.destroy');
            Route::put('/usuarios/{usuarioId}/rol', [ManagerUserController::class, 'setRole'])->name('usuarios.rol');
            Route::delete('/usuarios/{usuarioId}/rol', [ManagerUserController::class, 'removeRole'])->name('usuarios.rol.destroy');
            Route::put('/usuarios/{usuarioId}/password', [ManagerUserController::class, 'resetPassword'])->name('usuarios.password');
            Route::post('/usuarios/{usuarioId}/permisos', [ManagerUserController::class, 'grantPermission'])->name('usuarios.permisos.grant');
            Route::post('/usuarios/{usuarioId}/permisos/revocar', [ManagerUserController::class, 'revokePermission'])->name('usuarios.permisos.revoke');

            Route::get('/publicidad', [PublicidadAdminController::class, 'index'])->name('publicidad.admin.index');
            Route::post('/publicidad', [PublicidadAdminController::class, 'store'])->name('publicidad.admin.store');
            Route::delete('/publicidad/{id}', [PublicidadAdminController::class, 'destroy'])->name('publicidad.admin.destroy');

            Route::get('/productos-manuales', [ProductoManualAdminController::class, 'index'])->name('productos-manuales.index');
            Route::post('/productos-manuales', [ProductoManualAdminController::class, 'store'])->name('productos-manuales.store');
            Route::get('/productos-manuales/grupos', [ProductoManualAdminController::class, 'gruposDistintos'])->name('productos-manuales.grupos');
            Route::get('/productos-manuales/marcas', [ProductoManualAdminController::class, 'marcasDistintas'])->name('productos-manuales.marcas');
            Route::get('/productos-manuales/{id}', [ProductoManualAdminController::class, 'show'])->name('productos-manuales.show');
            Route::put('/productos-manuales/{id}', [ProductoManualAdminController::class, 'update'])->name('productos-manuales.update');
            Route::delete('/productos-manuales/{id}', [ProductoManualAdminController::class, 'destroy'])->name('productos-manuales.destroy');
            Route::post('/productos-manuales/{id}/anular', [ProductoManualAdminController::class, 'toggleAnulado'])->name('productos-manuales.toggle-anulado');

            Route::get('/pedidos', [PedidoAdminController::class, 'index'])->name('pedidos.admin.index');
            Route::get('/pedidos/{id}/pdf', [PedidoAdminController::class, 'downloadPdf'])->name('pedidos.admin.pdf');
            Route::get('/pedidos/{id}', [PedidoAdminController::class, 'show'])->name('pedidos.admin.show');
        });

    });
});

