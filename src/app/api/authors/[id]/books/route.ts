import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// GET - Libros de un autor
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const author = await prisma.author.findUnique({ where: { id } })
    if (!author) {
      return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
    }
    const books = await prisma.book.findMany({
      where: { authorId: id },
      orderBy: { publishedYear: 'desc' },
    })
    return NextResponse.json(books)
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Error al obtener libros' }, { status: 500 })
  }
}