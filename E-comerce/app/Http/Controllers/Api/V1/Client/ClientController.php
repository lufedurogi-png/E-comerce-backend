<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Data\Request\RequestClientData;
use App\Http\Controllers\Controller;
use App\Services\ClienteService;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function __construct(
        private readonly ClienteService $clientService
    ) {}

    public function registerClientByAuthUser(RequestClientData $request){
        $result = $this->clientService->create($request);
        $status = $result->success ? 201 : 409;
        return response()->json($result, $status);
    }

    public function update(RequestClientData $request){
        $result = $this->clientService->update($request);
        $status = $result->success ? 200 : 404;
        return response()->json($result, $status);
    }   

    public function getClientAuth(Request $request){
        $result = $this->clientService->getClientAuthUser();
        $status = ($result->success && $result->data) ? 200 : 404;
        return response()->json($result, $status);
    }
}