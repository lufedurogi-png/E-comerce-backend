<?php

namespace App\Services;

use App\Data\Client\ClientData;
use App\Data\Request\RequestClientData;
use App\Data\Response\ApiResponseData;
use App\Models\Cliente;
use Illuminate\Support\Facades\Auth;

class ClienteService
{
    public function create(RequestClientData $data):ApiResponseData
    {
        $user = Auth::user();
        $clientDataExists = $user->cliente()->exists();
        if($clientDataExists){
            return new ApiResponseData(
                success:false,
                message:'Ya se registraron sus datos previamente'
            );
        }

        $clientData = Auth::user()->cliente()->create($data->toArray());
        if(!$clientData){
            return new ApiResponseData(
                success:false,
                message:'Error al registrar los datos del usuario'
            );
        }
        return new ApiResponseData(
            success: true,
            message: 'Cliente creado exitosamente',
            data: ClientData::fromModel($clientData)
        );
    }

    public function update(RequestClientData $data):ApiResponseData
    {   
        $userId = Auth::user()->id;
        $cliente = $this->findByUserId($userId);

        if(!$cliente){
            return new ApiResponseData(
                success:false,
                message:'No se encontraron datos del cliente'
            );
        }
        
        $result = array_filter($data->toArray(), fn($value) => $value !== null);    
        $cliente->update($result);
        $cliente->refresh();

        return new ApiResponseData(
            success: true,
            message: 'Cliente actualizado exitosamente',
            data:  ClientData::fromModel($cliente)
        );
    }

    public function getClientAuthUser(): ?ApiResponseData
    {
        $user = Auth::user();
        $client = $this->findByUserId($user->id);

        if(!$client){
            return new ApiResponseData(
                success:false,
                message:'No se han registrados los datos del cliente'
            );
        }

        return new ApiResponseData(
            success:true,
            message:'Tus datos',
            data:ClientData::fromModel($client)
        );
    }

    private function findById(int $id): ?Cliente
    {
        return Cliente::find($id);
    }

    private function findByUserId(int|string $id):?Cliente{
        return Cliente::where('user_id',$id)->first();
    }

}
