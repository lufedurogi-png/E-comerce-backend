<?php

namespace App\Enum\Permisos;

use App\Enum\User\UserRole;

enum PermissionEnum: string
{
    // Products
    case VIEW_PRODUCTS = 'view products';
    case CREATE_PRODUCTS = 'create products';
    case EDIT_PRODUCTS = 'edit products';
    case DELETE_PRODUCTS = 'delete products';
    
    // Profile
    case VIEW_PROFILE = 'view profile';
    case EDIT_PROFILE = 'edit profile';
    
    // Orders
    case VIEW_ORDERS = 'view orders';
    case CREATE_ORDERS = 'create orders';
    case CANCEL_ORDERS = 'cancel orders';
    
    // Admin
    case VIEW_DASHBOARD = 'view dashboard';
    case MANAGE_USERS = 'manage users';

    public function label(): string
    {
        return match($this) {
            self::VIEW_PRODUCTS => 'Ver Productos',
            self::CREATE_PRODUCTS => 'Crear Productos',
            self::EDIT_PRODUCTS => 'Editar Productos',
            self::DELETE_PRODUCTS => 'Eliminar Productos',
            self::VIEW_PROFILE => 'Ver Perfil',
            self::EDIT_PROFILE => 'Editar Perfil',
            self::VIEW_ORDERS => 'Ver Órdenes',
            self::CREATE_ORDERS => 'Crear Órdenes',
            self::CANCEL_ORDERS => 'Cancelar Órdenes',
            self::VIEW_DASHBOARD => 'Ver Dashboard',
            self::MANAGE_USERS => 'Gestionar Usuarios',
        };
    }

    public function group(): string
    {
        return match($this) {
            self::VIEW_PRODUCTS, self::CREATE_PRODUCTS, 
            self::EDIT_PRODUCTS, self::DELETE_PRODUCTS => 'Productos',
            
            self::VIEW_PROFILE, self::EDIT_PROFILE => 'Perfil',
            
            self::VIEW_ORDERS, self::CREATE_ORDERS, 
            self::CANCEL_ORDERS => 'Órdenes',
            
            self::VIEW_DASHBOARD, self::MANAGE_USERS => 'Administración',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function forRole(UserRole $role): array
    {
        return match($role) {
            UserRole::ADMIN => self::values(),
            
            UserRole::CUSTOMER => [
                self::VIEW_PRODUCTS->value,
                self::VIEW_PROFILE->value,
                self::EDIT_PROFILE->value,
                self::VIEW_ORDERS->value,
                self::CREATE_ORDERS->value,
            ],

            UserRole::SELLER => [
                self::VIEW_PRODUCTS->value,
                self::VIEW_PROFILE->value,
                self::EDIT_PROFILE->value,
                self::VIEW_ORDERS->value,
                self::CREATE_ORDERS->value,
                
            ],
            
            UserRole::ADMIN => [
                self::VIEW_PRODUCTS->value,
                self::EDIT_PRODUCTS->value,
                self::DELETE_PRODUCTS->value,
                self::VIEW_DASHBOARD->value,
                self::MANAGE_USERS->value,
            ],
        };
    }
}
