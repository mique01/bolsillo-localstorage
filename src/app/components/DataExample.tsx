'use client';
import { useState, useEffect } from 'react';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  user_id: string;
}

export default function DataExample() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState('');
  
  useEffect(() => {
    loadTodos();
  }, []);

  function loadTodos() {
    setLoading(true);
    try {
      const storedTodos = localStorage.getItem('todos');
      if (storedTodos) {
        const parsedTodos = JSON.parse(storedTodos);
        if (Array.isArray(parsedTodos)) {
          setTodos(parsedTodos);
        }
      }
    } catch (error) {
      console.error('Error loading todos:', error);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }

  function handleAddTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    try {
      const newTodoItem: Todo = {
        id: Date.now(), // Using timestamp as ID
        title: newTodo,
        completed: false,
        user_id: 'local-user' // Since we're using localStorage, we'll use a static user ID
      };
      
      const updatedTodos = [newTodoItem, ...todos];
      localStorage.setItem('todos', JSON.stringify(updatedTodos));
      setTodos(updatedTodos);
      setNewTodo('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Todos</h2>
      
      <form onSubmit={handleAddTodo} className="flex gap-2">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Add
        </button>
      </form>
      
      {loading ? (
        <p>Loading todos...</p>
      ) : (
        <ul className="space-y-2">
          {todos.length === 0 ? (
            <p>No todos found</p>
          ) : (
            todos.map((todo) => (
              <li key={todo.id} className="p-3 border rounded flex items-center gap-2">
                <span className={todo.completed ? 'line-through' : ''}>
                  {todo.title}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
} 