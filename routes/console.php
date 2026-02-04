<?php

use App\Services\CVAService;
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

// CVA sync cada 5 min (token se renueva solo)
Schedule::command('cva:sync')->everyFiveMinutes();
