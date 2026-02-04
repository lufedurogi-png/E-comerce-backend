<?php

use App\Http\Controllers\Api\V1\Auth\AuthController as ApiAuthController;
use App\Http\Controllers\Api\V1\BusquedaController;
use App\Http\Controllers\Api\V1\CarritoController;
use App\Http\Controllers\Api\V1\Client\ClientController;
use App\Http\Controllers\Api\V1\FavoritoController;
use App\Http\Controllers\Api\V1\DatoFacturacionController;
use App\Http\Controllers\Api\V1\DireccionEnvioController;
use App\Http\Controllers\Api\V1\PedidoController;
use App\Http\Controllers\Api\V1\ProductoController;
use App\Http\Controllers\Api\V1\PruebaPedidoController;
use App\Http\Controllers\Api\V1\TarjetaGuardadaController;
use App\Http\Controllers\Spa\Auth\AuthController as SpaAuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
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

            Route::get('/tarjetas-guardadas', [TarjetaGuardadaController::class, 'index'])->name('tarjetas-guardadas.index');
            Route::post('/tarjetas-guardadas', [TarjetaGuardadaController::class, 'store'])->name('tarjetas-guardadas.store');
            Route::put('/tarjetas-guardadas/{id}', [TarjetaGuardadaController::class, 'update'])->name('tarjetas-guardadas.update');
            Route::delete('/tarjetas-guardadas/{id}', [TarjetaGuardadaController::class, 'destroy'])->name('tarjetas-guardadas.destroy');
        });

    });
});

