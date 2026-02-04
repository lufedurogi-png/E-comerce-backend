<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Enum\User\UserType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'tipo',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'tipo' => UserType::class,
        ];
    }

    //relacion con el modelo Cliente
    public function cliente(){
        return $this->hasOne(Cliente::class); //el usuario solo puede tener un cliente relacionado
    }

    public function direccionesEnvio()
    {
        return $this->hasMany(DireccionEnvio::class, 'user_id');
    }

    public function datosFacturacion()
    {
        return $this->hasMany(DatoFacturacion::class, 'user_id');
    }

    public function pedidos()
    {
        return $this->hasMany(Pedido::class, 'user_id');
    }

    public function carritoItems()
    {
        return $this->hasMany(CarritoItem::class, 'user_id');
    }

    public function favoritos()
    {
        return $this->hasMany(Favorito::class, 'user_id');
    }

    public function tarjetasGuardadas()
    {
        return $this->hasMany(TarjetaGuardada::class, 'user_id');
    }
}
