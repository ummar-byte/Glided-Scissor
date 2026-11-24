import { isSupabaseConfigured } from './client'
import { demoRepository } from './demo'
import { remoteRepository } from './remote'
import type { SalonRepository } from './repository'

export const repository: SalonRepository = isSupabaseConfigured ? remoteRepository : demoRepository
export { isSupabaseConfigured }
