'use client'

import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'

type Author = { id: string; name: string }
type Book = {
  id: string
  title: string
  description: string | null
  isbn: string | null
  publishedYear: number | null
  genre: string | null
  pages: number | null
  authorId: string
  author: Author
}
type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

const LIMIT = 6
const SORTS = [
  { value: 'createdAt:desc', label: 'Más recientes' },
  { value: 'createdAt:asc', label: 'Más antiguos' },
  { value: 'title:asc', label: 'Título A-Z' },
  { value: 'title:desc', label: 'Título Z-A' },
  { value: 'publishedYear:desc', label: 'Año (mayor a menor)' },
  { value: 'publishedYear:asc', label: 'Año (menor a mayor)' },
]
const emptyForm = {
  title: '',
  authorId: '',
  isbn: '',
  publishedYear: '',
  genre: '',
  pages: '',
  description: '',
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)

  const [authors, setAuthors] = useState<Author[]>([])
  const [genres, setGenres] = useState<string[]>([])

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('')
  const [authorFilterId, setAuthorFilterId] = useState('')
  const [sort, setSort] = useState('createdAt:desc')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const authorName = authors.find((a) => a.id === authorFilterId)?.name ?? ''

  async function loadMeta() {
    const [a, b] = await Promise.all([
      fetch('/api/authors').then((r) => r.json()),
      fetch('/api/books').then((r) => r.json()),
    ])
    setAuthors(a.map((x: Author) => ({ id: x.id, name: x.name })))
    const g = (b as Book[]).map((x) => x.genre).filter((x): x is string => !!x)
    setGenres([...new Set(g)].sort())
  }

  // Carga inicial (autores y géneros) y autor preseleccionado desde ?authorId=
  useEffect(() => {
    loadMeta()
    const preset = new URLSearchParams(window.location.search).get('authorId')
    if (preset) setForm((f) => ({ ...f, authorId: preset }))
  }, [])

  // Búsqueda en tiempo real (espera 400 ms después de dejar de escribir)
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // Pedir libros al endpoint de búsqueda
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const [sortBy, order] = sort.split(':')
    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
      sortBy,
      order,
    })
    if (search) params.set('search', search)
    if (genre) params.set('genre', genre)
    if (authorName) params.set('authorName', authorName)

    fetch(`/api/books/search?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return
        setBooks(res.data ?? [])
        setPagination(res.pagination ?? null)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [search, genre, authorName, sort, page, reloadKey])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      title: form.title,
      authorId: form.authorId,
      isbn: form.isbn || null,
      publishedYear: form.publishedYear ? Number(form.publishedYear) : null,
      genre: form.genre || null,
      pages: form.pages ? Number(form.pages) : null,
      description: form.description || null,
    }

    const res = await fetch(editingId ? `/api/books/${editingId}` : '/api/books', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Error al guardar')
    } else {
      setForm(emptyForm)
      setEditingId(null)
      setReloadKey((k) => k + 1)
      loadMeta()
    }
    setSaving(false)
  }

  function startEdit(b: Book) {
    setEditingId(b.id)
    setForm({
      title: b.title,
      authorId: b.authorId,
      isbn: b.isbn ?? '',
      publishedYear: b.publishedYear?.toString() ?? '',
      genre: b.genre ?? '',
      pages: b.pages?.toString() ?? '',
      description: b.description ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleDelete(b: Book) {
    if (!confirm(`¿Eliminar "${b.title}"?`)) return
    await fetch(`/api/books/${b.id}`, { method: 'DELETE' })
    if (books.length === 1 && page > 1) setPage(page - 1)
    else setReloadKey((k) => k + 1)
    loadMeta()
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setGenre('')
    setAuthorFilterId('')
    setSort('createdAt:desc')
    setPage(1)
  }

  // Números de página a mostrar (ventana de 5)
  const totalPages = pagination?.totalPages ?? 1
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => start + i
  )

  const input =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-indigo-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">📚 Sistema de Biblioteca</h1>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/" className="hover:underline">Dashboard</Link>
            <Link href="/books" className="underline">Libros</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {/* Formulario */}
        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">
            {editingId ? 'Editar libro' : 'Crear libro'}
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <input className={input} placeholder="Título *" required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select className={input} required value={form.authorId}
              onChange={(e) => setForm({ ...form, authorId: e.target.value })}>
              <option value="">Selecciona un autor *</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <input className={input} placeholder="ISBN" value={form.isbn}
              onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
            <input className={input} placeholder="Género" list="genre-list" value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value })} />
            <datalist id="genre-list">
              {genres.map((g) => <option key={g} value={g} />)}
            </datalist>
            <input className={input} type="number" placeholder="Año de publicación" value={form.publishedYear}
              onChange={(e) => setForm({ ...form, publishedYear: e.target.value })} />
            <input className={input} type="number" placeholder="Páginas" value={form.pages}
              onChange={(e) => setForm({ ...form, pages: e.target.value })} />
            <textarea className={`${input} md:col-span-2`} rows={2} placeholder="Descripción" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
            {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
            <div className="flex gap-3 md:col-span-2">
              <button disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear libro'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit}
                  className="rounded-lg border border-gray-300 px-5 py-2 font-medium hover:bg-gray-100">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Filtros */}
        <section className="rounded-xl bg-white p-6 shadow">
          <div className="grid gap-4 md:grid-cols-4">
            <input className={`${input} md:col-span-4`} placeholder="🔍 Buscar por título..."
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <select className={input} value={genre}
              onChange={(e) => { setGenre(e.target.value); setPage(1) }}>
              <option value="">Todos los géneros</option>
              {genres.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select className={input} value={authorFilterId}
              onChange={(e) => { setAuthorFilterId(e.target.value); setPage(1) }}>
              <option value="">Todos los autores</option>
              {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select className={input} value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1) }}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button onClick={clearFilters}
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-100">
              Limpiar filtros
            </button>
          </div>
        </section>

        {/* Resultados */}
        <section>
          <p className="mb-4 text-sm text-gray-600">
            {loading ? 'Buscando...' : `${pagination?.total ?? 0} resultado(s) encontrado(s)`}
          </p>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : books.length === 0 ? (
            <p className="rounded-xl bg-white p-8 text-center text-gray-500 shadow">
              No se encontraron libros.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((b) => (
                <div key={b.id} className="flex flex-col rounded-xl bg-white p-5 shadow">
                  <h3 className="text-lg font-semibold">{b.title}</h3>
                  <Link href={`/authors/${b.author.id}`}
                    className="text-sm text-indigo-700 hover:underline">
                    {b.author.name}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {b.genre && (
                      <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-700">{b.genre}</span>
                    )}
                    {b.publishedYear && (
                      <span className="rounded-full bg-gray-100 px-2 py-1">{b.publishedYear}</span>
                    )}
                    {b.pages && (
                      <span className="rounded-full bg-gray-100 px-2 py-1">{b.pages} págs.</span>
                    )}
                  </div>
                  {b.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{b.description}</p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => startEdit(b)}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm text-white hover:bg-amber-600">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(b)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40">
                ← Anterior
              </button>
              {pageNumbers.map((n) => (
                <button key={n} onClick={() => setPage(n)}
                  className={`rounded-lg px-3 py-1.5 ${
                    n === page
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-300 bg-white hover:bg-gray-100'
                  }`}>
                  {n}
                </button>
              ))}
              <button disabled={!pagination.hasNext} onClick={() => setPage(page + 1)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40">
                Siguiente →
              </button>
              <span className="w-full text-center text-sm text-gray-500">
                Página {pagination.page} de {pagination.totalPages}
              </span>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}