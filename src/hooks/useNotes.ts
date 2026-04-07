import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchFolders, createFolder, updateFolder, deleteFolder,
  fetchNotes, fetchNote, createNote, updateNote, deleteNote,
} from '../lib/api'

// Folders
export function useFolders() {
  return useQuery({ queryKey: ['folders'], queryFn: fetchFolders })
}

export function useCreateFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; icon?: string; color?: string }) => createFolder(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  })
}

export function useUpdateFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; icon: string; color: string }> }) =>
      updateFolder(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  })
}

export function useDeleteFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteFolder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  })
}

// Notes list (without content — for sidebar)
export function useNotes(folderId: number | null) {
  return useQuery({
    queryKey: ['notes', folderId],
    queryFn: () => fetchNotes(folderId!),
    enabled: folderId !== null,
  })
}

// Single note with content
export function useNote(noteId: number | null) {
  return useQuery({
    queryKey: ['note', noteId],
    queryFn: () => fetchNote(noteId!),
    enabled: noteId !== null,
    staleTime: 0,
  })
}

export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ folderId, title }: { folderId: number; title?: string }) =>
      createNote(folderId, title),
    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: ['notes', note.folder_id] })
      qc.invalidateQueries({ queryKey: ['folders'] })
    },
  })
}

export function useUpdateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ title: string; content: string }> }) =>
      updateNote(id, data),
    onSuccess: (note) => {
      qc.setQueryData(['note', note.id], note)
      qc.invalidateQueries({ queryKey: ['notes', note.folder_id] })
    },
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: number; folderId: number }) => deleteNote(id),
    onSuccess: (_data, { folderId }) => {
      qc.invalidateQueries({ queryKey: ['notes', folderId] })
      qc.invalidateQueries({ queryKey: ['folders'] })
    },
  })
}
