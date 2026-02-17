<?php

namespace App\Data\User;

use Spatie\LaravelData\Data;

class GrantPermissionData extends Data
{
    public function __construct(
        public string $permission,
        public string $adminPassword,
    ) {}
}
