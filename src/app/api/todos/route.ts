import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In a real application, you would fetch todos from a database
    // For now, we'll just return an empty array
    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // In a real application, you would save the todo to a database
    // For now, we'll just return the todo
    const todo = {
      id: Date.now().toString(),
      title,
      completed: false,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({ data: todo });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 