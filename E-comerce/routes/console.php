<?php

use App\Services\CVAService;
use App\Services\DescuentoPrecioService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('cva:sync', function () {
    $cva = app(CVAService::class);
    if (! $cva->isConfigured()) {
        $this->warn('CVA no está configurado (CVA_USER / CVA_PASSWORD en .env).');

        return 1;
    }
    $this->info('Sincronizando catálogo CVA...');
    $result = $cva->syncFullCatalog();
    if (! empty($result['error'])) {
        $this->error('Error: '.$result['error']);

        return 1;
    }
    $this->info('Sincronizados '.($result['synced'] ?? 0).' productos en '.($result['pages'] ?? 0).' páginas.');

    return 0;
})->purpose('Sincronizar catálogo de productos CVA a la base de datos');

Artisan::command('precios:sync-referencia', function () {
    $service = app(DescuentoPrecioService::class);
    $this->info('Sincronizando precios de referencia (snapshot cada 3 días)...');
    $result = $service->syncPreciosReferencia();
    $this->info('Actualizados '.($result['updated'] ?? 0).' precios de referencia.');

    return 0;
})->purpose('Copiar precios actuales de productos_cva a precios_referencia (ejecutar cada 3 días)');

Artisan::command('precios:comparar-descuentos', function () {
    $service = app(DescuentoPrecioService::class);
    $this->info('Comparando precios actuales con referencia (descuentos)...');
    $result = $service->compararPrecios();
    $this->info('Con descuento: '.($result['con_descuento'] ?? 0).', sin descuento actualizado: '.($result['sin_descuento'] ?? 0).'.');

    return 0;
})->purpose('Comparar precios cada 12 h y actualizar tabla producto_descuento');

// CVA sync cada 5 min (token se renueva solo)
Schedule::command('cva:sync')->everyFiveMinutes();

// Precios de referencia: actualizar cada 3 días (a las 02:00)
Schedule::command('precios:sync-referencia')->cron('0 2 */3 * *');

// Comparación de descuentos: cada 12 horas (06:00 y 18:00)
Schedule::command('precios:comparar-descuentos')->twiceDaily(6, 18);
