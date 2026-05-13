import { create } from 'zustand'
import type { Member, CreateMemberInput } from '../types'
import { memberService } from '../services/memberService'

interface MemberStore {
  members: Member[]
  loading: boolean
  error: string | null
  fetchMembers: () => Promise<void>
  createMember: (input: CreateMemberInput) => Promise<void>
  updateMember: (input: { id: number; name: string; role: string; dailyHours: number }) => Promise<void>
  deleteMember: (id: number) => Promise<void>
}

export const useMemberStore = create<MemberStore>((set) => ({
  members: [],
  loading: false,
  error: null,

  fetchMembers: async () => {
    set({ loading: true, error: null })
    try {
      const members = await memberService.list()
      set({ members, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  createMember: async (input) => {
    set({ error: null })
    try {
      const member = await memberService.create(input)
      set((state) => ({ members: [...state.members, member] }))
    } catch (e) {
      set({ error: String(e) })
      throw e
    }
  },

  updateMember: async (input) => {
    set({ error: null })
    try {
      const updated = await memberService.update(input)
      set((state) => ({
        members: state.members.map((m) => (m.id === updated.id ? updated : m)),
      }))
    } catch (e) {
      set({ error: String(e) })
      throw e
    }
  },

  deleteMember: async (id) => {
    set({ error: null })
    try {
      await memberService.delete(id)
      set((state) => ({ members: state.members.filter((m) => m.id !== id) }))
    } catch (e) {
      set({ error: String(e) })
      throw e
    }
  },
}))
