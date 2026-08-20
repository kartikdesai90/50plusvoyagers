<?php

namespace App\Http\Resources\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The admin-facing shape of a user. Kept explicit so the API never leaks
 * columns that happen to be added to the model later.
 *
 * @property-read User $resource
 */
class AdminUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'name' => $this->resource->name,
            'email' => $this->resource->email,
            // Every row in `users` is an admin; the flag is kept in the payload
            // because the admin SPA's auth context already reads it.
            'is_admin' => true,
        ];
    }
}
