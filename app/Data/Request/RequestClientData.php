<?php

namespace App\Data\Request;

use App\Models\Cliente;
use Illuminate\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\Digits;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\Sometimes;
use Spatie\LaravelData\Attributes\Validation\Uppercase;
use Spatie\LaravelData\Data;
use Str;

class RequestClientData extends Data
{
    public function __construct(
        #[Max(100)]
        public string $nombre,
        
        #[Max(100)]
        public string $apellidos,
        
        #[Max(10), Min(10)]
        public ?string $telefono,
        
        #[Max(250)]
        public string $calle,
        
        #[Max(250)]
        public string $colonia,
        
        #[Max(100)]
        public string $ciudad,
        
        #[Max(100)]
        public string $estado,
        
        #[Digits(5)]
        public string $codigo_postal,
        
        #[Max(10)]
        public ?string $numero_exterior,
        
        #[Max(10)]
        public ?string $numero_interior,
        
        #[Sometimes, Max(250)]
        public ?string $referencias,
        
        #[Sometimes, Max(250), Uppercase, Min(3)]
        public ?string $razon_social,
        
        #[Sometimes, Max(13), Min(12), Uppercase, Regex('/^([A-ZÑ&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2})([A\d])$/')]
        public ?string $rfc,
    ) {}

    public static function rules(): array
    {
        // Obtener el cliente del usuario autenticado
        $cliente = auth()->user()?->cliente;
        $clienteId = $cliente?->id;

        return [
            'telefono' => [
                'nullable',
                Rule::unique('clientes', 'telefono')
                    ->ignore($clienteId, 'id') // Especificar explícitamente la columna
            ],
            'rfc' => [
                'nullable',
                Rule::unique('clientes', 'rfc')
                    ->ignore($clienteId, 'id')
            ],
        ];
    }

    public static function prepareForPipeline(array $properties): array
    {
        return collect($properties)->map(function ($value, $key) {
            if (is_string($value)) {
                $value = trim($value);
            }
            return match($key){
                'nombre','apellidos' => Str::title($value),
                'rfc' => Str::upper(str_replace([' ','-'],'',$value)),
                'razon_social' => Str::upper($value),
                'telefono' => str_replace([' ','-','(',')'],'',$value),
                default => $value,
            };
        })->toArray();
    }

    public static function messages(): array
    {
        return [
            'rfc.regex' => 'El formato del RFC es incorrecto.',
            'rfc.uppercase' => 'EL RFC debe estar en mayusculas',
            'rfc.min' => 'El RFC no debe ser menor a 12 caracteres',
            'rfc.max' => 'El RFC no debe ser mayor a 13 caracteres',
            'telefono.unique' => 'El telefono ya está registrado.',
            'rfc.unique' => 'El RFC ya está registrado.',
            'nombre.required' => 'El nombre es requerido',
            'apellidos.required' => 'Los apellidos son requeridos',
            'calle.required' => 'El Nombre de la Calle es requerido',
            'colonia.required' => 'El nombre de la Colonia es requerido',
            'ciudad.required' => 'El nombre de la Ciudad es requerido',
            'estado.required' => 'El estado es requerido',
            'codigo_postal.required' => 'El codigo postal es requerido',
            'nombre.max' => 'El nombre no puede pasar de los 100 caracteres',
            'telefono.max' => 'El numero de telefono no debe superar los 10 caracteres',
            'telefono.min' => 'El numero de telefono debe de tener 10 caracteres',
            'codigo_postal.digits' => 'El codigo postal debe tener 5 digitos',
            'numero_interior.max' => 'El numero interior no debe superar los 10 caracteres',
            'numero_interior.min' => 'El numero interior no debe ser menor a los 10 caracteres',
            'numero_exterior.min' => 'El numero exterior no debe ser menor a los 10 caracteres',
            'numero_exterior.max' => 'El numero exterior no debe superar los 10 caracteres',
            'referencias.max' => 'Las referencias no pueden superar los 250 caracteres',
            'razon_social.uppercase' => 'La razon social debe estar en mayusculas',
            'razon_social.min' => 'La razon social tiene que ser mayor a 3 caracteres',
            'razon_social.max' => 'La razon social no debe superar los 250 caracteres'
        ];
    }

    public static function fromModel(Cliente $cliente): self
    {
        return new self(
            nombre: $cliente->nombre,
            apellidos: $cliente->apellidos,
            telefono: $cliente->telefono,
            calle: $cliente->calle,
            colonia: $cliente->colonia,
            ciudad: $cliente->ciudad,
            estado: $cliente->estado,
            codigo_postal: $cliente->codigo_postal,
            numero_exterior: $cliente->numero_exterior,
            numero_interior: $cliente->numero_interior,
            referencias: $cliente->referencias,
            razon_social: $cliente->razon_social,
            rfc: $cliente->rfc,
        );
    }
}