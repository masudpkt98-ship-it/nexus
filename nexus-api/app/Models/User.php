<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role', 'title', 'avatar', 'npk', 'unit', 'directorate', 'must_change_password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
        ];
    }

    /**
     * Permissions granted to each role (RBAC map).
     *
     * @var array<string, array<int, string>>
     */
    public const ROLE_PERMISSIONS = [
        'Administrator' => ['*'],
        'VP' => [
            'dashboard.view', 'programs.view', 'programs.manage', 'tasks.view', 'tasks.manage',
            'tasks.approve', 'competency.view', 'competency.manage', 'performance.view',
            'performance.manage', 'requests.view', 'requests.approve', 'analytics.view',
            'objectives.view', 'objectives.manage', 'meetings.view', 'knowledge.view',
            'notifications.view', 'satisfaction.view', 'ai.view',
        ],
        'Executive' => [
            'dashboard.view', 'programs.view', 'tasks.view', 'competency.view', 'performance.view',
            'requests.view', 'requests.approve', 'analytics.view', 'objectives.view', 'meetings.view',
            'knowledge.view', 'notifications.view', 'satisfaction.view', 'ai.view',
        ],
        'Manager' => [
            'dashboard.view', 'programs.view', 'programs.manage', 'tasks.view', 'tasks.manage',
            'tasks.approve', 'competency.view', 'competency.manage', 'performance.view',
            'requests.view', 'analytics.view', 'objectives.view', 'objectives.manage',
            'meetings.view', 'knowledge.view', 'notifications.view', 'satisfaction.view', 'ai.view',
        ],
        'Supervisor' => [
            'dashboard.view', 'programs.view', 'tasks.view', 'tasks.manage', 'competency.view',
            'performance.view', 'requests.view', 'objectives.view', 'meetings.view',
            'knowledge.view', 'notifications.view', 'satisfaction.view', 'ai.view',
        ],
        'Staff' => [
            'dashboard.view', 'tasks.view', 'tasks.manage', 'competency.view', 'performance.view',
            'knowledge.view', 'meetings.view', 'notifications.view', 'ai.view',
        ],
        'Internal Customer' => [
            'dashboard.view', 'requests.view', 'requests.create', 'knowledge.view', 'notifications.view',
            'satisfaction.view',
        ],
        // Nexian — the KPI Partner team. Data is scoped to their unit kerja
        // (Partner) / directorate (Manajemen) by the frontend via unit/directorate.
        'KPI Partner Manajemen' => [
            'dashboard.view', 'competency.view', 'performance.view', 'performance.manage',
            'people.view', 'objectives.view', 'analytics.view', 'knowledge.view', 'notifications.view', 'ai.view',
        ],
        'KPI Partner' => [
            'dashboard.view', 'competency.view', 'performance.view', 'people.view',
            'knowledge.view', 'notifications.view', 'ai.view',
        ],
    ];

    public function permissions(): array
    {
        return self::ROLE_PERMISSIONS[$this->role] ?? [];
    }

    public function hasPermission(string $permission): bool
    {
        $perms = $this->permissions();

        return in_array('*', $perms, true) || in_array($permission, $perms, true);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assignee_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }
}
