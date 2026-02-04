<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Umbral de confirmaciones para correcciones aprendidas
    |--------------------------------------------------------------------------
    | Número mínimo de clics exitosos (termino_original -> termino_corregido)
    | que debe acumularse para que la corrección se aplique en futuras búsquedas.
    */
    'umbral_confirmaciones' => (int) env('BUSQUEDA_UMBRAL_CONFIRMACIONES', 3),

    /*
    |--------------------------------------------------------------------------
    | Similitud mínima (porcentaje 0-100) para sugerir corrección
    |--------------------------------------------------------------------------
    | Entre término ingresado y términos conocidos (grupos, marcas, etc.).
    */
    'similitud_minima_porcentaje' => (float) env('BUSQUEDA_SIMILITUD_MINIMA', 70),

    /*
    |--------------------------------------------------------------------------
    | Límite de resultados por búsqueda
    |--------------------------------------------------------------------------
    */
    'limite_resultados' => (int) env('BUSQUEDA_LIMITE_RESULTADOS', 50),
];
