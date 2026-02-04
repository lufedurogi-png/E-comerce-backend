<?php

namespace App\Data\Response;

class ApiResponseData
{
    public function __construct(
        public bool $success,
        public ?string $message = null,
        public mixed $data = null,
    ) {}
}