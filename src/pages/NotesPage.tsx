import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder,
  useNotes, useNote, useCreateNote, useUpdateNote, useDeleteNote,
} from '../hooks/useNotes'
import type { NoteFolder, NoteListItem } from '../types'

const FOLDER_COLORS: Record<string, string> = {
  default: 'text-text-muted',
  yellow: 'text-yellow-400',
  blue: 'text-blue-400',
  green: 'text-green-400',
  red: 'text-red-400',
  purple: 'text-purple-400',
  orange: 'text-orange-400',
}

const COLOR_OPTIONS = [
  { value: 'default', label: 'Grey' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'red', label: 'Red' },
  { value: 'purple', label: 'Purple' },
  { value: 'orange', label: 'Orange' },
]

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Folder form modal ────────────────────────────────────────────────────────

function FolderModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<NoteFolder>
  onSave: (data: { name: string; icon: string; color: string }) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '📁')
  const [color, setColor] = useState(initial?.color ?? 'default')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm px-4">
      <div className="bg-bg-card border border-bg-border rounded-xl p-6 w-full max-w-sm space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-muted">
          {initial?.id ? 'Edit Folder' : 'New Folder'}
        </h2>
        <div className="flex gap-3">
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={2}
            className="w-12 text-center bg-bg border border-bg-border rounded-lg px-2 py-2 text-lg focus:outline-none focus:border-primary"
          />
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSave({ name, icon, color })}
            placeholder="Folder name"
            className="flex-1 bg-bg border border-bg-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary placeholder:text-text-muted"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`font-mono text-xs px-2.5 py-1 rounded-md border transition-colors ${
                color === c.value
                  ? 'border-primary text-primary'
                  : 'border-bg-border text-text-muted hover:border-primary'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="font-mono text-xs text-text-muted hover:text-primary transition-colors px-3 py-1.5">
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onSave({ name, icon, color })}
            disabled={!name.trim()}
            className="px-4 py-1.5 bg-primary text-bg font-mono text-xs uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Note editor ──────────────────────────────────────────────────────────────

function NoteEditor({ noteId, folderId }: { noteId: number; folderId: number }) {
  const { data: note, isLoading } = useNote(noteId)
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
    }
  }, [noteId, note?.id])

  const scheduleSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        setSaving(true)
        await updateNote.mutateAsync({ id: noteId, data: { title: newTitle, content: newContent } })
        setSaving(false)
      }, 800)
    },
    [noteId, updateNote]
  )

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [])

  if (isLoading) {
    return <div className="font-mono text-xs text-text-muted p-8 text-center">loading...</div>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-bg-border flex-shrink-0">
        <span className="font-mono text-xs text-text-muted">
          {saving ? 'saving...' : note ? `Saved · ${formatDate(note.updated_at)}` : ''}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview((v) => !v)}
            className={`font-mono text-xs px-2.5 py-1 rounded-md border transition-colors ${
              preview
                ? 'border-primary text-primary'
                : 'border-bg-border text-text-muted hover:border-primary hover:text-primary'
            }`}
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this note?')) {
                deleteNote.mutate({ id: noteId, folderId })
              }
            }}
            className="font-mono text-xs text-text-muted hover:text-red-400 transition-colors px-2.5 py-1 rounded-md border border-bg-border"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          scheduleSave(e.target.value, content)
        }}
        placeholder="Title"
        className="w-full bg-transparent px-5 py-4 text-lg font-semibold text-primary focus:outline-none placeholder:text-text-muted border-b border-bg-border flex-shrink-0"
      />

      {/* Content */}
      {preview ? (
        <div className="flex-1 overflow-auto px-5 py-4 prose prose-invert prose-sm max-w-none
          prose-headings:font-semibold prose-headings:text-primary prose-headings:mt-4
          prose-p:text-primary prose-p:leading-relaxed
          prose-li:text-primary prose-code:text-primary prose-code:bg-bg prose-code:px-1 prose-code:rounded
          prose-pre:bg-bg prose-pre:border prose-pre:border-bg-border
          prose-a:text-primary prose-blockquote:border-primary prose-blockquote:text-text-muted">
          {content ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <p className="text-text-muted italic">Nothing to preview yet. Switch to edit mode and start writing.</p>
          )}
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            scheduleSave(title, e.target.value)
          }}
          placeholder="Start writing... (Markdown supported)"
          className="flex-1 bg-transparent px-5 py-4 text-sm text-primary resize-none focus:outline-none placeholder:text-text-muted font-mono leading-relaxed"
        />
      )}
    </div>
  )
}

// ─── Notes sidebar (note list) ────────────────────────────────────────────────

function NotesList({
  folder,
  selectedNoteId,
  onSelectNote,
}: {
  folder: NoteFolder
  selectedNoteId: number | null
  onSelectNote: (id: number) => void
}) {
  const { data: notes = [], isLoading } = useNotes(folder.id)
  const createNote = useCreateNote()

  async function handleCreate() {
    const note = await createNote.mutateAsync({ folderId: folder.id })
    onSelectNote(note.id)
  }

  return (
    <div className="flex flex-col h-full border-r border-bg-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border flex-shrink-0">
        <span className={`font-mono text-xs uppercase tracking-widest ${FOLDER_COLORS[folder.color] ?? FOLDER_COLORS.default}`}>
          {folder.icon} {folder.name}
        </span>
        <button
          onClick={handleCreate}
          title="New note"
          className="w-6 h-6 flex items-center justify-center rounded border border-bg-border text-text-muted hover:text-primary hover:border-primary transition-colors text-sm"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="font-mono text-xs text-text-muted p-4 text-center">loading...</div>
        )}
        {!isLoading && notes.length === 0 && (
          <div className="font-mono text-xs text-text-muted p-4 text-center">
            No notes yet.{' '}
            <button onClick={handleCreate} className="hover:text-primary transition-colors underline">
              Create one
            </button>
          </div>
        )}
        {notes.map((note: NoteListItem) => (
          <button
            key={note.id}
            onClick={() => onSelectNote(note.id)}
            className={`w-full text-left px-4 py-3 border-b border-bg-border transition-colors hover:bg-bg ${
              selectedNoteId === note.id ? 'bg-bg' : ''
            }`}
          >
            <p className={`font-mono text-xs truncate ${selectedNoteId === note.id ? 'text-primary' : 'text-text-muted'}`}>
              {note.title}
            </p>
            <p className="font-mono text-xs text-text-muted/60 mt-0.5">{formatDate(note.updated_at)}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NotesPage() {
  const { data: folders = [], isLoading: foldersLoading } = useFolders()
  const createFolder = useCreateFolder()
  const updateFolder = useUpdateFolder()
  const deleteFolder = useDeleteFolder()

  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null)
  const [folderModal, setFolderModal] = useState<{ open: boolean; editing?: NoteFolder }>({ open: false })

  // Auto-select first folder
  useEffect(() => {
    if (folders.length > 0 && selectedFolderId === null) {
      setSelectedFolderId(folders[0].id)
    }
  }, [folders, selectedFolderId])

  // Clear selected note when folder changes
  function handleSelectFolder(id: number) {
    if (id !== selectedFolderId) {
      setSelectedFolderId(id)
      setSelectedNoteId(null)
    }
  }

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null

  async function handleSaveFolder(data: { name: string; icon: string; color: string }) {
    if (folderModal.editing) {
      await updateFolder.mutateAsync({ id: folderModal.editing.id, data })
    } else {
      const folder = await createFolder.mutateAsync(data)
      setSelectedFolderId(folder.id)
      setSelectedNoteId(null)
    }
    setFolderModal({ open: false })
  }

  async function handleDeleteFolder(folder: NoteFolder) {
    if (!confirm(`Delete "${folder.name}" and all its notes?`)) return
    await deleteFolder.mutateAsync(folder.id)
    if (selectedFolderId === folder.id) {
      setSelectedFolderId(null)
      setSelectedNoteId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-bg-card border border-bg-border rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="flex h-full">

          {/* Folders sidebar */}
          <div className="w-48 flex-shrink-0 border-r border-bg-border flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border flex-shrink-0">
              <span className="font-mono text-xs uppercase tracking-widest text-text-muted">Folders</span>
              <button
                onClick={() => setFolderModal({ open: true })}
                title="New folder"
                className="w-5 h-5 flex items-center justify-center rounded border border-bg-border text-text-muted hover:text-primary hover:border-primary transition-colors text-sm"
              >
                +
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {foldersLoading && (
                <div className="font-mono text-xs text-text-muted p-4 text-center">loading...</div>
              )}
              {folders.map((folder) => (
                <div key={folder.id} className="group relative">
                  <button
                    onClick={() => handleSelectFolder(folder.id)}
                    className={`w-full text-left px-4 py-2.5 transition-colors hover:bg-bg flex items-center gap-2 ${
                      selectedFolderId === folder.id ? 'bg-bg' : ''
                    }`}
                  >
                    <span className="text-sm flex-shrink-0">{folder.icon}</span>
                    <span className={`font-mono text-xs truncate flex-1 ${
                      selectedFolderId === folder.id
                        ? (FOLDER_COLORS[folder.color] ?? FOLDER_COLORS.default)
                        : 'text-text-muted'
                    }`}>
                      {folder.name}
                    </span>
                    <span className="font-mono text-xs text-text-muted/50 flex-shrink-0">{folder.note_count}</span>
                  </button>
                  {/* Folder actions on hover */}
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); setFolderModal({ open: true, editing: folder }) }}
                      className="w-5 h-5 flex items-center justify-center rounded text-text-muted hover:text-primary hover:bg-bg transition-colors font-mono text-xs"
                      title="Edit folder"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder) }}
                      className="w-5 h-5 flex items-center justify-center rounded text-text-muted hover:text-red-400 hover:bg-bg transition-colors font-mono text-xs"
                      title="Delete folder"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              {!foldersLoading && folders.length === 0 && (
                <div className="font-mono text-xs text-text-muted p-4 text-center">
                  No folders yet.
                </div>
              )}
            </div>
          </div>

          {/* Notes list */}
          <div className="w-52 flex-shrink-0">
            {selectedFolder ? (
              <NotesList
                folder={selectedFolder}
                selectedNoteId={selectedNoteId}
                onSelectNote={setSelectedNoteId}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="font-mono text-xs text-text-muted">Select a folder</p>
              </div>
            )}
          </div>

          {/* Note editor */}
          <div className="flex-1 min-w-0">
            {selectedNoteId && selectedFolder ? (
              <NoteEditor noteId={selectedNoteId} folderId={selectedFolder.id} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="font-mono text-xs text-text-muted">
                  {selectedFolder ? 'Select or create a note' : 'Select a folder to get started'}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {folderModal.open && (
        <FolderModal
          initial={folderModal.editing}
          onSave={handleSaveFolder}
          onClose={() => setFolderModal({ open: false })}
        />
      )}
    </div>
  )
}
