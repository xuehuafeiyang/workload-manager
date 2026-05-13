import { invoke } from '@tauri-apps/api/core'
import type { Member, CreateMemberInput } from '../types'

export const memberService = {
  list: () => invoke<Member[]>('list_members'),
  create: (input: CreateMemberInput) => invoke<Member>('create_member', { input }),
  update: (input: { id: number; name: string; role: string; dailyHours: number }) =>
    invoke<Member>('update_member', { input }),
  delete: (id: number) => invoke<void>('delete_member', { id }),
}
