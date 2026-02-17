<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Data\User\AdminCreateUserData;
use App\Data\User\AdminPasswordConfirmData;
use App\Data\User\GrantPermissionData;
use App\Data\User\AdminResetPasswordData;
use App\Data\User\AdminUpdateUserData;
use App\Data\User\AssignRoleUserData;
use App\Data\User\RemoveRoleUserData;
use App\Http\Controllers\Controller;
use App\Services\Users\ManagerUsersService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ManagerUserController extends Controller
{
    public function __construct(
        protected ManagerUsersService $managerUsersService
    ) {}

    public function getTypesUser(): JsonResponse
    {
        $result = $this->managerUsersService->getTypesUser();
        return response()->json($result, Response::HTTP_OK);
    }

    public function getPermissions(): JsonResponse
    {
        $result = $this->managerUsersService->getPermissions();
        return response()->json($result, Response::HTTP_OK);
    }

    public function index(Request $request): JsonResponse
    {
        $result = $this->managerUsersService->listUsers(
            $request->query('search'),
            $request->query('role'),
            $request->query('permission')
        );
        return response()->json($result, Response::HTTP_OK);
    }

    public function store(AdminCreateUserData $data): JsonResponse
    {
        $result = $this->managerUsersService->createUser($data);
        return response()->json($result, $result->success ? Response::HTTP_CREATED : Response::HTTP_BAD_REQUEST);
    }

    public function update(AdminUpdateUserData $data, int $usuarioId): JsonResponse
    {
        $result = $this->managerUsersService->updateUser($data, $usuarioId);
        return response()->json($result, $result->success ? Response::HTTP_OK : Response::HTTP_BAD_REQUEST);
    }

    public function setRole(AssignRoleUserData $data, int $usuarioId): JsonResponse
    {
        $result = $this->managerUsersService->assignRoleToUser($data, $usuarioId);
        return response()->json($result, $result->success ? Response::HTTP_OK : Response::HTTP_BAD_REQUEST);
    }

    public function removeRole(RemoveRoleUserData $data, int $usuarioId): JsonResponse
    {
        $result = $this->managerUsersService->removeRoleFromUser($data, $usuarioId);
        return response()->json($result, $result->success ? Response::HTTP_OK : Response::HTTP_BAD_REQUEST);
    }

    public function destroy(AdminPasswordConfirmData $data, int $usuarioId): JsonResponse
    {
        $result = $this->managerUsersService->deleteUser($data, $usuarioId);
        return response()->json($result, $result->success ? Response::HTTP_OK : Response::HTTP_BAD_REQUEST);
    }

    public function resetPassword(AdminResetPasswordData $data, int $usuarioId): JsonResponse
    {
        $result = $this->managerUsersService->resetPassword($data, $usuarioId);
        return response()->json($result, $result->success ? Response::HTTP_OK : Response::HTTP_BAD_REQUEST);
    }

    public function grantPermission(GrantPermissionData $data, int $usuarioId): JsonResponse
    {
        $result = $this->managerUsersService->grantPermission($usuarioId, $data);
        return response()->json($result, $result->success ? Response::HTTP_OK : Response::HTTP_BAD_REQUEST);
    }

    public function revokePermission(GrantPermissionData $data, int $usuarioId): JsonResponse
    {
        $result = $this->managerUsersService->revokePermission($usuarioId, $data);
        return response()->json($result, $result->success ? Response::HTTP_OK : Response::HTTP_BAD_REQUEST);
    }
}
