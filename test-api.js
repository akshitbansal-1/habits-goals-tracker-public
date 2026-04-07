#!/usr/bin/env node
// API test script — run with: node test-api.js
// Requires the dev server running: node server.js

const BASE = 'http://localhost:3000/api'
let passed = 0
let failed = 0

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

async function test(name, fn) {
  try {
    const result = await fn()
    console.log(`  ✅ ${name}`)
    passed++
    return result
  } catch (err) {
    console.error(`  ❌ ${name}: ${err.message}`)
    failed++
    return null
  }
}

async function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed')
}

console.log('\n── Health ───────────────────────────────────')
await test('GET /api/health → db connected', async () => {
  const data = await req('GET', '/health')
  assert(data.status === 'ok', `Expected ok, got ${data.status}`)
})

console.log('\n── Today & Habits ───────────────────────────')
const today = new Date().toISOString().split('T')[0]

let todayData
await test('GET /api/today → returns items array', async () => {
  todayData = await req('GET', `/today?date=${today}`)
  assert(todayData.date === today, 'date mismatch')
  assert(Array.isArray(todayData.items), 'items should be array')
})

console.log('\n── Items CRUD ───────────────────────────────')
let createdItem
await test('POST /api/items → create habit', async () => {
  createdItem = await req('POST', '/items', {
    name: '__test_habit__',
    category: 'habit',
    description: 'Created by test-api.js',
    sort_order: 999,
  })
  assert(createdItem.id, 'missing id')
  assert(createdItem.name === '__test_habit__', 'name mismatch')
  assert(createdItem.active === true, 'should be active')
})

await test('PUT /api/items/:id → update habit name', async () => {
  if (!createdItem) throw new Error('no item to update')
  const updated = await req('PUT', `/items/${createdItem.id}`, { name: '__test_habit_updated__' })
  assert(updated.name === '__test_habit_updated__', `name not updated: ${updated.name}`)
})

await test('GET /api/items → list contains created item', async () => {
  const items = await req('GET', '/items')
  assert(Array.isArray(items), 'should be array')
  assert(items.some((i) => i.id === createdItem?.id), 'created item not in list')
})

let canToggle = false
if (todayData?.items?.length > 0) {
  const firstItem = todayData.items[0]
  await test(`POST /api/toggle → toggle item ${firstItem.id}`, async () => {
    const result = await req('POST', '/toggle', { item_id: firstItem.id, date: today })
    assert(typeof result.completed === 'boolean', 'completed should be boolean')
    canToggle = true
    // Toggle back
    await req('POST', '/toggle', { item_id: firstItem.id, date: today })
  })
} else {
  console.log('  ⚠ Skipping toggle — no items for today')
}

await test('DELETE /api/items/:id → delete test habit', async () => {
  if (!createdItem) throw new Error('no item to delete')
  const result = await req('DELETE', `/items/${createdItem.id}`)
  assert(result.deleted === true || result.deactivated === true, 'should be deleted or deactivated')
})

console.log('\n── History & Stats ──────────────────────────')
await test('GET /api/history?days=7 → returns array', async () => {
  const data = await req('GET', '/history?days=7')
  assert(Array.isArray(data), 'should be array')
})

await test('GET /api/stats?days=30 → returns weekly array', async () => {
  const data = await req('GET', '/stats?days=30')
  assert(Array.isArray(data.weekly), 'weekly should be array')
})

console.log('\n── Goals CRUD ───────────────────────────────')
let createdGoal
await test('POST /api/goals → create goal', async () => {
  createdGoal = await req('POST', '/goals', {
    title: '__test_goal__',
    description: 'Created by test-api.js',
    identity_statement: 'I am a tester',
    why_it_matters: 'To verify APIs work',
    target_completions: 30,
    deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    linked_item_ids: [],
  })
  assert(createdGoal.id, 'missing id')
  assert(createdGoal.title === '__test_goal__', 'title mismatch')
  assert(createdGoal.status === 'active', 'should be active')
})

await test('GET /api/goals → list contains created goal', async () => {
  const goals = await req('GET', '/goals')
  assert(Array.isArray(goals), 'should be array')
  assert(goals.some((g) => g.id === createdGoal?.id), 'created goal not in list')
})

await test('PUT /api/goals/:id → update goal title', async () => {
  if (!createdGoal) throw new Error('no goal to update')
  const updated = await req('PUT', `/goals/${createdGoal.id}`, { title: '__test_goal_updated__' })
  assert(updated.title === '__test_goal_updated__', `title not updated: ${updated.title}`)
})

await test('PUT /api/goals/:id → mark goal completed', async () => {
  if (!createdGoal) throw new Error('no goal to update')
  const updated = await req('PUT', `/goals/${createdGoal.id}`, { status: 'completed' })
  assert(updated.status === 'completed', `status not updated: ${updated.status}`)
})

await test('DELETE /api/goals/:id → delete test goal', async () => {
  if (!createdGoal) throw new Error('no goal to delete')
  const result = await req('DELETE', `/goals/${createdGoal.id}`)
  assert(result.deleted === true, 'should be deleted')
})

console.log('\n── Notes & Folders ──────────────────────────')
let createdFolder
await test('POST /api/folders → create folder', async () => {
  createdFolder = await req('POST', '/folders', { name: '__test_folder__', icon: '🧪', color: 'blue' })
  assert(createdFolder.id, 'missing id')
  assert(createdFolder.name === '__test_folder__', 'name mismatch')
})

await test('GET /api/folders → list contains created folder', async () => {
  const folders = await req('GET', '/folders')
  assert(Array.isArray(folders), 'should be array')
  assert(folders.some((f) => f.id === createdFolder?.id), 'created folder not in list')
})

let createdNote
await test('POST /api/notes → create note in folder', async () => {
  if (!createdFolder) throw new Error('no folder to create note in')
  createdNote = await req('POST', '/notes', { folder_id: createdFolder.id, title: '__test_note__', content: '# Hello\nTest content' })
  assert(createdNote.id, 'missing id')
  assert(createdNote.title === '__test_note__', 'title mismatch')
})

await test('GET /api/notes?folder_id=:id → list notes', async () => {
  if (!createdFolder) throw new Error('no folder')
  const notes = await req('GET', `/notes?folder_id=${createdFolder.id}`)
  assert(Array.isArray(notes), 'should be array')
  assert(notes.some((n) => n.id === createdNote?.id), 'note not in list')
})

await test('GET /api/notes/:id → fetch note content', async () => {
  if (!createdNote) throw new Error('no note')
  const note = await req('GET', `/notes/${createdNote.id}`)
  assert(note.content === '# Hello\nTest content', 'content mismatch')
})

await test('PUT /api/notes/:id → update note content', async () => {
  if (!createdNote) throw new Error('no note')
  const updated = await req('PUT', `/notes/${createdNote.id}`, { content: '# Updated\nNew content' })
  assert(updated.content === '# Updated\nNew content', 'content not updated')
})

await test('DELETE /api/folders/:id → delete folder (cascades notes)', async () => {
  if (!createdFolder) throw new Error('no folder')
  const result = await req('DELETE', `/folders/${createdFolder.id}`)
  assert(result.deleted === true, 'should be deleted')
})

console.log(`\n${'─'.repeat(45)}`)
console.log(`  ${passed} passed  ${failed > 0 ? failed + ' failed' : ''}`)
if (failed > 0) process.exit(1)
