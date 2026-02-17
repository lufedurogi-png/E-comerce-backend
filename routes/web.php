<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['message' => 'API is running'], 200);
});

Route::get('/admin/login', function () {
    $frontend = rtrim(config('app.frontend_url'), '/');
    return redirect($frontend . '/admin-login');
})->name('admin.login');
