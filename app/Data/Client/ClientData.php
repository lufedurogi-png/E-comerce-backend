<?php

namespace App\Data\Client;

use App\Models\Cliente;
use Carbon\Carbon;
use Spatie\LaravelData\Data;

class ClientData extends Data
{
    
    public function __construct(
        public int $id,
        public string $nombre,
        public string $apellidos,
        public ?string $telefono,
        public string $calle,
        public string $colonia,
        public string $ciudad,
        public string $estado,
        public string $codigo_postal,
        public ?string $numero_exterior,
        public ?string $numero_interior,
        public ?string $referencias,
        public ?string $razon_social,
        public ?string $rfc,
        public Carbon $ultimaActualizacion
    )
    {
        //
    }

    public static function fromModel(Cliente $client):self
    {
        return new self(
            id:$client->id,
            nombre: $client->nombre,
            apellidos: $client->apellidos,
            telefono: $client->telefono,
            calle: $client->calle,
            colonia: $client->colonia,
            ciudad: $client->ciudad,
            estado: $client->estado,
            codigo_postal: $client->codigo_postal,
            numero_exterior: $client->numero_exterior,
            numero_interior: $client->numero_interior,
            referencias: $client->referencias,
            razon_social: $client->razon_social,
            rfc: $client->rfc,
            ultimaActualizacion: Carbon::createFromFormat('d/m/Y H:i:s', $client->updated_at->format('d/m/Y H:i:s'))
        );
    }
}
