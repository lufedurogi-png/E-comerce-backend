<?php

namespace App\Data\User;

use App\Enum\User\UserType;
use App\Models\User;
use Spatie\LaravelData\Data;

class UserData extends Data
{
    // Clase para representar datos de usuario - respuesta al cliente
    
   public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public ?UserType $tipo,
        public ?string $email_verified_at = null,
    ) {}
    
    public static function fromModel(User $user): self
    {
        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            tipo: $user->tipo,
            email_verified_at: $user->email_verified_at?->toIso8601String(),
        );
    }
}
