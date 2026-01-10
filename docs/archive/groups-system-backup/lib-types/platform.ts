// Platform admin types

export type PlatformAdminRole = 'owner' | 'admin'

export interface PlatformAdmin {
  id: string
  user_id: string
  role: PlatformAdminRole
  created_by: string | null
  created_at: string
  is_active: boolean
}

export interface PlatformAdminWithUser extends PlatformAdmin {
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
  }
}

// Helper to check if user is platform owner
export function isPlatformOwner(admin: PlatformAdmin | null): boolean {
  return admin?.role === 'owner' && admin?.is_active === true
}

// Helper to check if user can manage platform admins
export function canManagePlatformAdmins(admin: PlatformAdmin | null): boolean {
  return isPlatformOwner(admin)
}

// Role labels for UI
export const platformAdminRoleLabels: Record<PlatformAdminRole, string> = {
  owner: 'Eier',
  admin: 'Administrator'
}

// Role descriptions for UI
export const platformAdminRoleDescriptions: Record<PlatformAdminRole, string> = {
  owner: 'Plattformets eier. Kan ikke slettes eller endres.',
  admin: 'Administrator med tilgang til moderering og administrasjon.'
}
