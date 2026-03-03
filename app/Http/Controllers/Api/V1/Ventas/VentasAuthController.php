<?php

namespace App\Http\Controllers\Api\V1\Ventas;

use App\Data\User\AccessUserData;
use App\Http\Controllers\Controller;
use App\Services\TokenAuthService;
use Symfony\Component\HttpFoundation\Response;

class VentasAuthController extends Controller
{
    public function __construct(
        private readonly TokenAuthService $authService
    ) {}

    public function token(AccessUserData $request)
    {
        $authResponse = $this->authService->sellerGenerateToken($request);

        return response()->json($authResponse, $authResponse->success ? Response::HTTP_OK : Response::HTTP_UNAUTHORIZED);
    }
}
