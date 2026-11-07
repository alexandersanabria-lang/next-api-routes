'use client'

import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Book = {
  id: string
  title: string
  description: string | null
  isbn: string | null
  publishedYear: number | null
  genre: string | null
  pages: number | null
}
type Author = {
  id: string
  name: string
  email: string
  bio: string | null
  nationality: string | null
  birthYear: number | null
  createdAt: string
  books: Book[]
  _count: { books: number }
}
type Stats = {
  authorId: string
  authorName: string
  totalBooks: number
  firstBook: { title: string; year: number } | null
  latestBook: { title: string; year: number } | null
  averagePages: number
  genres: string[]
  longestBook: { title: string; pages: number } | null
  shortestBook: { title: string; pages: number } | null
}

export default function AuthorDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [author, setAuthor] = useState<Author | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', nationality: '', birthYear: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadAll() {
    const [aRes, sRes] = await Promise.all([
      fetch(`/api/authors/${id}`),
      fetch(`/api/authors/${id}/stats`),
    ])
    if (!aRes.ok) {
      setNotFound(true)
      setLoading(false)
      return
    }
    setAuthor(await aRes.json())
    if (sRes.ok) setStats(await sRes.json())
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function startEdit() {
    if (!author) return
    setForm({
      name: author.name,
      email: author.email,
      nationality: author.nationality ?? '',
      birthYear: author.birthYear?.toString() ?? '',
      bio: author.bio ?? '',
    })
    setError('')
    setEditing(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch(`/api/authors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        nationality: form.nationality || null,
        birthYear: form.birthYear ? Number(form.birthYear) : null,
        bio: form.bio || null,
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Error al guardar')
    } else {
      setEditing(false)
      await loadAll()
    }
    setSaving(false)
  }

  async function deleteBook(b: Book) {
    if (!confirm(`¿Eliminar "${b.title}"?`)) return
    await fetch(`/api/books/${b.id}`, { method: 'DELETE' })
    await loadAll()
  }

  const input =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-indigo-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">📚 Sistema de Biblioteca</h1>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/" className="hover:underline">Dashboard</Link>
            <Link href="/books" className="hover:underline">Libros</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {loading ? (
          <p className="text-gray-500">Cargando autor...</p>
        ) : notFound || !author ? (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            <p className="mb-4 text-gray-600">Autor no encontrado.</p>
            <Link href="/" className="text-indigo-700 underline">Volver al dashboard</Link>
          </div>
        ) : (
          <>
            <Link href="/" className="text-sm text-indigo-700 hover:underline">
              ← Volver al dashboard
            </Link>

            {/* Información del autor */}
            <section className="rounded-xl bg-white p-6 shadow">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{author.name}</h2>
                  <p className="text-gray-500">{author.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={startEdit}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
                    Editar autor
                  </button>
                  <Link href={`/books?authorId=${author.id}`}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                    + Agregar libro
                  </Link>
                </div>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-gray-500">Nacionalidad</dt>
                  <dd className="font-medium">{author.nationality ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Año de nacimiento</dt>
                  <dd className="font-medium">{author.birthYear ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Registrado</dt>
                  <dd className="font-medium">
                    {new Date(author.createdAt).toLocaleDateString('es-PE')}
                  </dd>
                </div>
              </dl>
              {author.bio && (
                <p className="mt-4 text-gray-700">{author.bio}</p>
              )}
            </section>

            {/* Formulario de edición */}
            {editing && (
              <section className="rounded-xl bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-semibold">Editar información</h3>
                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                  <input className={input} placeholder="Nombre *" required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <input className={input} type="email" placeholder="Email *" required value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <input className={input} placeholder="Nacionalidad" value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
                  <input className={input} type="number" placeholder="Año de nacimiento" value={form.birthYear}
                    onChange={(e) => setForm({ ...form, birthYear: e.target.value })} />
                  <textarea className={`${input} md:col-span-2`} rows={3} placeholder="Biografía" value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                  {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
                  <div className="flex gap-3 md:col-span-2">
                    <button disabled={saving}
                      className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button type="button" onClick={() => setEditing(false)}
                      className="rounded-lg border border-gray-300 px-5 py-2 font-medium hover:bg-gray-100">
                      Cancelar
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* Estadísticas */}
            {stats && (
              <section>
                <h3 className="mb-4 text-lg font-semibold">Estadísticas</h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-xl bg-white p-4 shadow">
                    <p className="text-sm text-gray-500">Total de libros</p>
                    <p className="text-3xl font-bold text-indigo-700">{stats.totalBooks}</p>
                  </div>
                  <div className="rounded-xl bg-white p-4 shadow">
                    <p className="text-sm text-gray-500">Promedio de páginas</p>
                    <p className="text-3xl font-bold text-indigo-700">{stats.averagePages}</p>
                  </div>
                  <div className="rounded-xl bg-white p-4 shadow">
                    <p className="text-sm text-gray-500">Primer libro</p>
                    <p className="font-semibold">{stats.firstBook?.title ?? '—'}</p>
                    <p className="text-sm text-gray-500">{stats.firstBook?.year}</p>
                  </div>
                  <div className="rounded-xl bg-white p-4 shadow">
                    <p className="text-sm text-gray-500">Último libro</p>
                    <p className="font-semibold">{stats.latestBook?.title ?? '—'}</p>
                    <p className="text-sm text-gray-500">{stats.latestBook?.year}</p>
                  </div>
                  <div className="rounded-xl bg-white p-4 shadow">
                    <p className="text-sm text-gray-500">Libro más largo</p>
                    <p className="font-semibold">{stats.longestBook?.title ?? '—'}</p>
                    <p className="text-sm text-gray-500">
                      {stats.longestBook ? `${stats.longestBook.pages} págs.` : ''}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-4 shadow">
                    <p className="text-sm text-gray-500">Libro más corto</p>
                    <p className="font-semibold">{stats.shortestBook?.title ?? '—'}</p>
                    <p className="text-sm text-gray-500">
                      {stats.shortestBook ? `${stats.shortestBook.pages} págs.` : ''}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-4 shadow md:col-span-2">
                    <p className="text-sm text-gray-500">Géneros</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {stats.genres.length === 0 && <span>—</span>}
                      {stats.genres.map((g) => (
                        <span key={g} className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Libros del autor */}
            <section>
              <h3 className="mb-4 text-lg font-semibold">
                Libros ({author.books.length})
              </h3>
              {author.books.length === 0 ? (
                <p className="rounded-xl bg-white p-8 text-center text-gray-500 shadow">
                  Este autor aún no tiene libros.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...author.books]
                    .sort((a, b) => (a.publishedYear ?? 0) - (b.publishedYear ?? 0))
                    .map((b) => (
                      <div key={b.id} className="flex flex-col rounded-xl bg-white p-5 shadow">
                        <h4 className="text-lg font-semibold">{b.title}</h4>
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
                        <button onClick={() => deleteBook(b)}
                          className="mt-4 self-start rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">
                          Eliminar
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}