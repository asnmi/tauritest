import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, Trash2, Check, Pencil, Calendar } from 'lucide-react';
import ConfirmDelete from '../schedule/ConfirmDelete';
import TimePicker, { TimeValue } from "../timepicker/Timepicker";
import { DatePicker } from "../calendar/datepicker";
import './todolist.css';

interface Category {
  id: number;
  name: string;
}

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  categoryId: number;
  executionDate?: string; // YYYY-MM-DD
  executionTime?: TimeValue;
}

export const TodoList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: 'Général' }
  ]);
  const [currentCategoryId, setCurrentCategoryId] = useState<number | null>(1);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [deletePopup, setDeletePopup] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [schedulingId, setSchedulingId] = useState<number | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '' || currentCategoryId === null) {
      setError('Veuillez entrer une tâche et sélectionner une catégorie');
      return;
    }
    
    const newTodo: Todo = {
      id: Date.now(),
      text: inputValue,
      completed: false,
      categoryId: currentCategoryId
    };

    setTodos([...todos, newTodo]);
    setInputValue('');
    setError('');
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
    setDeletePopup(null);
  };

  const startEditing = (id: number, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = (id: number) => {
    if (editText.trim() === '') {
      setError('Le texte ne peut pas être vide');
      return;
    }
    
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, text: editText.trim() } : todo
      )
    );
    setEditingId(null);
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      saveEdit(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  /*const handleClickOutside = (e: React.MouseEvent) => {
    if (editingId !== null && editInputRef.current && !editInputRef.current.contains(e.target as Node)) {
      saveEdit(editingId);
    }
  };*/

  const updateTodoDate = (id: number, date: string) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, executionDate: date } : todo));
  };

  const updateTodoTime = (id: number, time: TimeValue) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, executionTime: time } : todo));
  };

  const formatSchedule = (todo: Todo): string => {
    if (!todo.executionDate && !todo.executionTime) return '';
    const dateStr = todo.executionDate ? new Date(todo.executionDate).toLocaleDateString('fr-FR') : '';
    const timeStr = todo.executionTime ? todo.executionTime : '';
    return `${dateStr}${dateStr && timeStr ? ' ' : ''}${timeStr}`;
  };

  // Gestion des catégories
  const addCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory = {
        id: Date.now(),
        name: newCategoryName.trim()
      };
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      if (currentCategoryId === null) {
        setCurrentCategoryId(newCategory.id);
      }
    }
  };

  const deleteCategory = (id: number) => {
    // Ne supprime pas la catégorie Général (id: 1)
    if (id === 1) return;

    setCategories(categories.filter(cat => cat.id !== id));
    if (currentCategoryId === id) {
      setCurrentCategoryId(1); // Retourne à la catégorie Général si on supprime la catégorie active
    }
    // Supprimer aussi les todos de cette catégorie
    setTodos(todos.filter(todo => todo.categoryId !== id));
  };

  const updateCategory = (id: number) => {
    // Ne permet pas de modifier la catégorie Général
    if (id === 1) {
      setEditingCategoryId(null);
      return;
    }

    setCategories(categories.map(cat => 
      cat.id === id ? { ...cat, name: editingCategoryName } : cat
    ));
    setEditingCategoryId(null);
  };

  const currentTodos = todos.filter(todo => todo.categoryId === currentCategoryId);

  return (
    <div className="todo-app">
      <div className="categories-sidebar">
        <h3 className="categories-title">Catégories</h3>
        <div className="add-category">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nouvelle catégorie..."
            className="category-input"
          />
          <button onClick={addCategory} className="category-add-btn">
            <PlusCircle size={20} />
          </button>
        </div>
        <ul className="category-list">
          {categories.map(category => (
            <li
              key={category.id}
              className={`category-item ${currentCategoryId === category.id ? 'active' : ''}`}
              onClick={() => setCurrentCategoryId(category.id)}
            >
              <div className="category-content">
                {editingCategoryId === category.id && category.id !== 1 ? ( // Permet l'édition uniquement si ce n'est pas la catégorie Général
                  <input
                    type="text"
                    value={editingCategoryName}
                    onChange={(e) => setEditingCategoryName(e.target.value)}
                    onBlur={() => updateCategory(category.id)}
                    onKeyPress={(e) => e.key === 'Enter' && updateCategory(category.id)}
                    autoFocus
                    className="category-edit-input"
                  />
                ) : (
                  <span className="category-name">{category.name}</span>
                )}
              </div>
              <div className="category-actions">
                {category.id !== 1 && ( // Affiche les actions uniquement si ce n'est pas la catégorie Général
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategoryId(category.id);
                        setEditingCategoryName(category.name);
                      }}
                      className="category-edit-btn"
                    >
                      <Pencil size={18} />
                    </button>
                    <ConfirmDelete
                      message="Êtes-vous sûr de vouloir supprimer cette catégorie ?"
                      onCancel={() => setDeletePopup(null)}
                      onConfirm={() => deleteCategory(category.id)}
                      open={deletePopup === category.id}
                      onOpenChange={(open) => setDeletePopup(open ? category.id : null)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletePopup(category.id);
                        }}
                        className="category-delete-btn"
                      >
                        <Trash2 size={18} />
                      </button>
                    </ConfirmDelete>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="todo-container">
        <h2 className="todo-title">{categories.find(c => c.id === currentCategoryId)?.name || 'Toutes les tâches'}</h2>
        
        <form onSubmit={addTodo} className="todo-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError('');
            }}
            placeholder="Ajouter une tâche..."
            className="todo-input"
          />
          <button
            type="submit"
            className="todo-submit"
          >
            <PlusCircle size={20} />
          </button>
        </form>
        
        {error && <p className="todo-error">{error}</p>}
        
        <div className="todo-list">
          {currentTodos.length === 0 ? (
            <p className="todo-empty">Aucune tâche pour le moment</p>
          ) : (
            currentTodos.map((todo) => (
              <div
                key={todo.id}
                className={`todo-item ${todo.completed ? 'completed' : ''}`}
              >
                <div className="todo-content">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`todo-checkbox ${todo.completed ? 'completed' : ''}`}
                    aria-label={todo.completed ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
                  >
                    {todo.completed && <Check size={14} />}
                  </button>
                  
                  {editingId === todo.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, todo.id)}
                      onBlur={() => saveEdit(todo.id)}
                      className="todo-edit-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div 
                      className={`todo-text ${todo.completed ? 'completed' : ''}`}
                      onClick={() => startEditing(todo.id, todo.text)}
                    >
                      {todo.text}
                    </div>
                  )}
                </div>
                {/* Scheduling section */}
                {schedulingId === todo.id ? (
                  <div className="todo-schedule">
                    {/*<input
                       type="date"
                       value={todo.executionDate || ''}
                       onChange={(e) => updateTodoDate(todo.id, e.target.value)}
                       className="todo-date-input"
                     />*/}
                    <DatePicker
                      selected={todo.executionDate ? new Date(todo.executionDate) : undefined}
                      onChange={(date) => updateTodoDate(todo.id, date ? date.toISOString().split('T')[0] : '')}
                      placeholder="Date"
                      minDate={new Date()}
                      required={false}
                    />
                    <TimePicker
                      value={todo.executionTime || ''}
                      onChange={(val) => updateTodoTime(todo.id, val)}
                      className="todo-timepicker"
                    />
                    <button
                      className="todo-schedule-validate"
                      onClick={() => setSchedulingId(null)}
                    >Valider</button>
                    <button
                      className="todo-schedule-cancel"
                      onClick={() => setSchedulingId(null)}
                    >X</button>
                  </div>
                ) : (
                  <div className="todo-schedule-static">
                    { (todo.executionDate || todo.executionTime) && (
                      <span className="todo-schedule-summary">{formatSchedule(todo)}</span>
                    ) }
                    <button
                      className="todo-schedule-btn"
                      title="Programmer"
                      onClick={() => setSchedulingId(todo.id)}
                    >
                      <Calendar size={16} />
                    </button>
                  </div>
                )}
                <ConfirmDelete
                  message="Êtes-vous sûr de vouloir supprimer cette tâche ?"
                  onCancel={() => setDeletePopup(null)}
                  onConfirm={() => deleteTodo(todo.id)}
                  open={deletePopup === todo.id}
                  onOpenChange={(open) => setDeletePopup(open ? todo.id : null)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletePopup(todo.id);
                    }}
                    className="todo-delete"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </ConfirmDelete>
              </div>
            ))
          )}
        </div>
        
        {currentTodos.length > 0 && (
          <div className="todo-stats">
            {currentTodos.filter(t => t.completed).length} sur {currentTodos.length} tâches terminées
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
