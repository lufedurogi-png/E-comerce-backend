<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Data\User\AccessUserData;
use App\Data\User\AdminRegisterData;
use App\Http\Controllers\Controller;
use App\Services\TokenAuthService;
use Symfony\Component\HttpFoundation\Response;

class AdminAuthController extends Controller
{
    public function __construct(
        private readonly TokenAuthService $authService
    ) {}

    public function register(AdminRegisterData $request)
    {
        $authResponse = $this->authService->adminRegister($request);

        return response()->json($authResponse, Response::HTTP_CREATED);
    }

    public function token(AccessUserData $request)
    {
        $authResponse = $this->authService->adminGenerateToken($request);

        return response()->json($authResponse, $authResponse->success ? Response::HTTP_OK : Response::HTTP_UNAUTHORIZED);
    }
}
