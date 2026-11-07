import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// GET - Libro por ID
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const book = await prisma.book.findUnique({
      where: { id },
      include: { author: true },
    })
    if (!book) {
      return NextResponse.json({ error: 'Libro no encontrado' }, { status: 404 })
    }
    return NextResponse.json(book)
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Error al obtener libro' }, { status: 500 })
  }
}

// PUT - Actualizar libro
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, isbn, publishedYear, genre, pages, authorId } = body

    const book = await prisma.book.update({
      where: { id },
      data: { title, description, isbn, publishedYear, genre, pages, authorId },
      include: { author: { select: { id: true, name: true } } },
    })
    return NextResponse.json(book)
  } catch (error: any) {
    console.log(error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Libro no encontrado' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El ISBN ya está registrado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al actualizar libro' }, { status: 500 })
  }
}

// DELETE - Eliminar libro
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params
    await prisma.book.delete({ where: { id } })
    return NextResponse.json({ message: 'Libro eliminado correctamente' })
  } catch (error: any) {
    console.log(error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Libro no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error al eliminar libro' }, { status: 500 })
  }
}