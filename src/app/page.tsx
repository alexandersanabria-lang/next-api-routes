'use client'

import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'

type Book = { id: string; title: string; genre: string | null; pages: number | null }
type Author = {
  id: string
  name: string
  email: string
  bio: string | null
  nationality: string | null
  birthYear: number | null
  books: Book[]
  _count: { books: number }
}

const emptyForm = { name: '', email: '', nationality: '', birthYear: '', bio: '' }

export default function Dashboard() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    const res = await fetch('/api/authors')
    setAuthors(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    fetch('/api/authors')
      .then((r) => r.json())
      .then((data) => {
        setAuthors(data)
        setLoading(false)
      })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name: form.name,
      email: form.email,
      nationality: form.nationality || null,
      birthYear: form.birthYear ? Number(form.birthYear) : null,
      bio: form.bio || null,
    }

    const res = await fetch(editingId ? `/api/authors/${editingId}` : '/api/authors', {
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
      await refresh()
    }
    setSaving(false)
  }

  function startEdit(a: Author) {
    setEditingId(a.id)
    setForm({
      name: a.name,
      email: a.email,
      nationality: a.nationality ?? '',
      birthYear: a.birthYear?.toString() ?? '',
      bio: a.bio ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleDelete(a: Author) {
    if (!confirm(`¿Eliminar a ${a.name} y sus ${a._count.books} libros?`)) return
    await fetch(`/api/authors/${a.id}`, { method: 'DELETE' })
    await refresh()
  }

  // Estadísticas generales
  const totalBooks = authors.reduce((s, a) => s + a._count.books, 0)
  const genres = new Set(authors.flatMap((a) => a.books.map((b) => b.genre).filter(Boolean)))
  const topAuthor = [...authors].sort((a, b) => b._count.books - a._count.books)[0]
  const avgBooks = authors.length ? (totalBooks / authors.length).toFixed(1) : '0'

  const input =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-indigo-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">📚 Sistema de Biblioteca</h1>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/" className="underline">Dashboard</Link>
            <Link href="/books" className="hover:underline">Libros</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {/* Estadísticas generales */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ['Autores', authors.length],
            ['Libros', totalBooks],
            ['Géneros', genres.size],
            ['Promedio libros/autor', avgBooks],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl bg-white p-4 shadow">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-3xl font-bold text-indigo-700">{value}</p>
            </div>
          ))}
          {topAuthor && topAuthor._count.books > 0 && (
            <div className="col-span-2 rounded-xl bg-white p-4 shadow md:col-span-4">
              <p className="text-sm text-gray-500">Autor con más libros</p>
              <p className="text-lg font-semibold">
                {topAuthor.name} ({topAuthor._count.books} libros)
              </p>
            </div>
          )}
        </section>

        {/* Formulario */}
        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">
            {editingId ? 'Editar autor' : 'Crear autor'}
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <input className={input} placeholder="Nombre *" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={input} type="email" placeholder="Email *" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className={input} placeholder="Nacionalidad" value={form.nationality}
              onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
            <input className={input} type="number" placeholder="Año de nacimiento" value={form.birthYear}
              onChange={(e) => setForm({ ...form, birthYear: e.target.value })} />
            <textarea className={`${input} md:col-span-2`} placeholder="Biografía" rows={2} value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
            <div className="flex gap-3 md:col-span-2">
              <button disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear autor'}
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

        {/* Lista de autores */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Autores</h2>
          {loading ? (
            <p className="text-gray-500">Cargando autores...</p>
          ) : authors.length === 0 ? (
            <p className="text-gray-500">Aún no hay autores. Crea el primero arriba.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {authors.map((a) => (
                <div key={a.id} className="flex flex-col rounded-xl bg-white p-5 shadow">
                  <h3 className="text-lg font-semibold">{a.name}</h3>
                  <p className="text-sm text-gray-500">{a.email}</p>
                  <p className="mt-1 text-sm">
                    {a.nationality ?? 'Sin nacionalidad'}
                    {a.birthYear ? ` · ${a.birthYear}` : ''}
                  </p>
                  {a.bio && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{a.bio}</p>}
                  <p className="mt-2 text-sm font-medium text-indigo-700">
                    {a._count.books} {a._count.books === 1 ? 'libro' : 'libros'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/authors/${a.id}`}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700">
                      Ver libros
                    </Link>
                    <button onClick={() => startEdit(a)}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm text-white hover:bg-amber-600">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(a)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}