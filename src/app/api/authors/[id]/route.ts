import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// GET - Obtener autor por ID
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const author = await prisma.author.findUnique({
      where: { id },
      include: { books: true, _count: { select: { books: true } } },
    })
    if (!author) {
      return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
    }
    return NextResponse.json(author)
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Error al obtener autor' }, { status: 500 })
  }
}

// PUT - Actualizar autor
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, bio, nationality, birthYear } = body

    const author = await prisma.author.update({
      where: { id },
      data: { name, email, bio, nationality, birthYear },
    })
    return NextResponse.json(author)
  } catch (error: any) {
    console.log(error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al actualizar autor' }, { status: 500 })
  }
}

// DELETE - Eliminar autor (sus libros se borran en cascada)
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params
    await prisma.author.delete({ where: { id } })
    return NextResponse.json({ message: 'Autor eliminado correctamente' })
  } catch (error: any) {
    console.log(error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error al eliminar autor' }, { status: 500 })
  }
}