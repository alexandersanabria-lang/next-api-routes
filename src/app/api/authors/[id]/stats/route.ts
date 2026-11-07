import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params

    const author = await prisma.author.findUnique({
      where: { id },
      include: { books: true },
    })
    if (!author) {
      return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
    }

    const books = author.books
    const withYear = books
      .filter((b) => b.publishedYear != null)
      .sort((a, b) => a.publishedYear! - b.publishedYear!)
    const withPages = books
      .filter((b) => b.pages != null)
      .sort((a, b) => a.pages! - b.pages!)

    const first = withYear[0]
    const latest = withYear[withYear.length - 1]
    const shortest = withPages[0]
    const longest = withPages[withPages.length - 1]

    const averagePages = withPages.length
      ? Math.round(withPages.reduce((sum, b) => sum + b.pages!, 0) / withPages.length)
      : 0

    const genres = [...new Set(books.map((b) => b.genre).filter((g): g is string => !!g))]

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks: books.length,
      firstBook: first ? { title: first.title, year: first.publishedYear } : null,
      latestBook: latest ? { title: latest.title, year: latest.publishedYear } : null,
      averagePages,
      genres,
      longestBook: longest ? { title: longest.title, pages: longest.pages } : null,
      shortestBook: shortest ? { title: shortest.title, pages: shortest.pages } : null,
    })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}