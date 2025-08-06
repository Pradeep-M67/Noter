import React, { useState, useEffect, useCallback } from 'react';
// Remove: import { useAuth } from '../contexts/AuthContext';
// Remove: import { notesAPI, todosAPI, logsAPI } from '../services/api';

const Dashboard = () => {
  // State management (similar to original App.js but with API integration)
  const [notes, setNotes] = useState([]);
  const [todos, setTodos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [currentDeleteId, setCurrentDeleteId] = useState(null);
  const [currentFilter, setCurrentFilter] = useState('pending');
  const [loggerSortOrder, setLoggerSortOrder] = useState('newest');
  const [activeTab, setActiveTab] = useState('create');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMethod, setSortMethod] = useState('newest');
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [todoInput, setTodoInput] = useState('');
  const [loggerInput, setLoggerInput] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Remove: const { user, logout } = useAuth();

  // Load data from API on mount
  useEffect(() => {
    setLoading(true);
    // Try to load from localStorage, or use empty arrays
    const notesData = JSON.parse(localStorage.getItem('notes')) || [];
    const todosData = JSON.parse(localStorage.getItem('todos')) || [];
    const logsData = JSON.parse(localStorage.getItem('logs')) || [];
    setNotes(notesData);
    setTodos(todosData);
    setLogs(logsData);
    setLoading(false);
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Utility functions
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLogTime = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const logDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffInDays = Math.floor((today - logDate) / (1000 * 60 * 60 * 24));
    
    const timeString = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    if (diffInDays === 0) {
      return `Today, ${timeString}`;
    } else if (diffInDays === 1) {
      return `Yesterday, ${timeString}`;
    } else if (diffInDays < 7) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      return `${dayName}, ${timeString}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  };

  const showToast = (message, type = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`);
    // You can implement a proper toast notification here
  };

  // Notes functions (frontend-only)
  const saveNote = () => {
    const title = noteTitle.trim();
    const content = noteContent.trim();
    if (!title && !content) {
      showToast('Please enter a title or content for your note.', 'error');
      return;
    }
    if (currentEditId) {
      setNotes(prev => {
        const updated = prev.map(note =>
          note._id === currentEditId ? { ...note, title: title || 'Untitled', content } : note
        );
        localStorage.setItem('notes', JSON.stringify(updated));
        return updated;
      });
      showToast('Note updated successfully!', 'success');
      cancelEdit();
    } else {
      const newNote = {
        _id: generateId(),
        title: title || 'Untitled',
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotes(prev => {
        const updated = [newNote, ...prev];
        localStorage.setItem('notes', JSON.stringify(updated));
        return updated;
      });
      showToast('Note saved successfully!', 'success');
      clearForm();
      setActiveTab('view');
    }
  };

  const editNote = (id) => {
    const note = notes.find(note => note._id === id);
    if (!note) return;
    setCurrentEditId(id);
    setNoteTitle(note.title === 'Untitled' ? '' : note.title);
    setNoteContent(note.content);
    setActiveTab('create');
  };

  const cancelEdit = () => {
    setCurrentEditId(null);
    clearForm();
  };

  const clearForm = () => {
    setNoteTitle('');
    setNoteContent('');
  };

  const deleteNote = (id) => {
    setCurrentDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!currentDeleteId) return;
    setNotes(prev => {
      const updated = prev.filter(note => note._id !== currentDeleteId);
      localStorage.setItem('notes', JSON.stringify(updated));
      return updated;
    });
    setShowDeleteModal(false);
    showToast('Note deleted successfully!', 'success');
    if (currentEditId === currentDeleteId) {
      cancelEdit();
    }
    setCurrentDeleteId(null);
  };

  // Todo functions (frontend-only)
  const addTodo = () => {
    const text = todoInput.trim();
    if (!text) return;
    const newTodo = {
      _id: generateId(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTodos(prev => {
      const updated = [newTodo, ...prev];
      localStorage.setItem('todos', JSON.stringify(updated));
      return updated;
    });
    setTodoInput('');
    showToast('Task added successfully!', 'success');
  };

  const toggleTodo = (id) => {
    setTodos(prev => {
      const updated = prev.map(todo =>
        todo._id === id ? { ...todo, completed: !todo.completed } : todo
      );
      localStorage.setItem('todos', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTodo = (id) => {
    setTodos(prev => {
      const updated = prev.filter(todo => todo._id !== id);
      localStorage.setItem('todos', JSON.stringify(updated));
      return updated;
    });
    showToast('Task deleted successfully!', 'success');
  };

  // Logger functions (frontend-only)
  const addLog = () => {
    const text = loggerInput.trim();
    if (!text) return;
    const newLog = {
      _id: generateId(),
      text,
      createdAt: new Date().toISOString(),
    };
    setLogs(prev => {
      const updated = [newLog, ...prev];
      localStorage.setItem('logs', JSON.stringify(updated));
      return updated;
    });
    setLoggerInput('');
    showToast('Moment logged successfully!', 'success');
  };

  const deleteLog = (id) => {
    setLogs(prev => {
      const updated = prev.filter(log => log._id !== id);
      localStorage.setItem('logs', JSON.stringify(updated));
      return updated;
    });
    showToast('Log deleted successfully!', 'success');
  };

  const clearAllLogs = () => {
    if (logs.length === 0) return;
    if (window.confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      setLogs([]);
      localStorage.setItem('logs', JSON.stringify([]));
      showToast('All logs cleared successfully!', 'success');
    }
  };

  // Filter and sort functions
  const filterNotes = useCallback(() => {
    if (!searchQuery) return notes;
    
    return notes.filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  const sortNotes = useCallback((notesToSort) => {
    return [...notesToSort].sort((a, b) => {
      switch (sortMethod) {
        case 'newest':
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        case 'oldest':
          return new Date(a.updatedAt || a.createdAt) - new Date(b.updatedAt || b.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      }
    });
  }, [sortMethod]);

  const filterTodos = useCallback(() => {
    switch (currentFilter) {
      case 'completed':
        return todos.filter(todo => todo.completed);
      case 'pending':
        return todos.filter(todo => !todo.completed);
      default:
        return todos;
    }
  }, [todos, currentFilter]);

  const sortLogs = useCallback(() => {
    return [...logs].sort((a, b) => {
      if (loggerSortOrder === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [logs, loggerSortOrder]);

  // Get processed data
  const filteredAndSortedNotes = sortNotes(filterNotes());
  const filteredTodos = filterTodos();
  const sortedLogs = sortLogs();

  // Calculate counts
  const pendingTodos = todos.filter(todo => !todo.completed).length;

  // Format current time in IST
  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  });

  const dateString = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (noteTitle.trim() || noteContent.trim()) {
          saveNote();
        }
      }
      
      if (e.key === 'Escape') {
        if (showDeleteModal) {
          setShowDeleteModal(false);
        } else if (currentEditId) {
          cancelEdit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [noteTitle, noteContent, showDeleteModal, currentEditId, cancelEdit, saveNote]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1><i className="fas fa-sticky-note"></i> My Space</h1>
          <div className="header-stats">
            <div className="stats-group">
              <span>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
              <span className="stats-separator">•</span>
              <span>{logs.length} {logs.length === 1 ? 'log' : 'logs'}</span>
            </div>
            <div className="pending-tasks-box">
              {pendingTodos} pending
            </div>
          </div>
        </header>

        {/* Rest of the dashboard content - keeping the same structure as original App.js */}
        <div className="main-layout">
          {/* Logger Sidebar */}
          <div className="logger-sidebar">
            <div className="datetime-widget">
              <div className="current-time">{timeString}</div>
              <div className="current-date">{dateString}</div>
            </div>
            
            <div className="logger-section">
              <div className="logger-header">
                <h2><i className="fas fa-clock"></i> Quick Logger</h2>
                <span>{logs.length} {logs.length === 1 ? 'log' : 'logs'}</span>
              </div>

              <div className="logger-form">
                <div className="logger-input-container">
                  <textarea 
                    value={loggerInput}
                    onChange={(e) => setLoggerInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addLog();
                      }
                    }}
                    placeholder="Log your moment..." 
                    rows="3" 
                    maxLength="200"
                  />
                  <button onClick={addLog} className="logger-add-btn">
                    <i className="fas fa-plus"></i> Log
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="main-content">
            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button 
                className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
              >
                <i className="fas fa-plus"></i> Create Note
              </button>
              <button 
                className={`tab-btn ${activeTab === 'view' ? 'active' : ''}`}
                onClick={() => setActiveTab('view')}
              >
                <i className="fas fa-list"></i> My Notes <span>({notes.length})</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'logger' ? 'active' : ''}`}
                onClick={() => setActiveTab('logger')}
              >
                <i className="fas fa-history"></i> Logs <span>({logs.length})</span>
              </button>
            </div>

            {/* Create Note Tab */}
            {activeTab === 'create' && (
              <div className="tab-content active">
                <div className="note-form-section">
                  <div className="note-form">
                    <input 
                      type="text" 
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="Note title..." 
                      maxLength="100"
                    />
                    <textarea 
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Write your note here..." 
                      rows="6"
                    />
                    <div className="form-actions">
                      <button 
                        onClick={saveNote}
                        className="btn btn-primary"
                        disabled={!noteTitle.trim() && !noteContent.trim()}
                      >
                        <i className="fas fa-save"></i> {currentEditId ? 'Update Note' : 'Save Note'}
                      </button>
                      {currentEditId && (
                        <button onClick={cancelEdit} className="btn btn-secondary">
                          <i className="fas fa-times"></i> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View Notes Tab */}
            {activeTab === 'view' && (
              <div className="tab-content active">
                <div className="search-section">
                  <div className="search-container">
                    <i className="fas fa-search"></i>
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search your notes..."
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="clear-btn"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                </div>

                <div className="notes-section">
                  <div className="notes-header">
                    <h2>Your Notes</h2>
                    <div className="sort-options">
                      <select 
                        value={sortMethod}
                        onChange={(e) => setSortMethod(e.target.value)}
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="title">Title A-Z</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="notes-container">
                    {filteredAndSortedNotes.length === 0 ? (
                      <div className="empty-state">
                        <i className="fas fa-sticky-note"></i>
                        <h3>No notes yet</h3>
                        <p>Create your first note to get started!</p>
                        <button 
                          className="btn btn-primary"
                          onClick={() => setActiveTab('create')}
                        >
                          <i className="fas fa-plus"></i> Create Note
                        </button>
                      </div>
                    ) : (
                      filteredAndSortedNotes.map(note => {
                        const createdDate = formatDate(note.createdAt);
                        const updatedDate = formatDate(note.updatedAt);
                        const isUpdated = note.createdAt !== note.updatedAt;
                        const maxContentLength = 200;
                        const truncatedContent = note.content.length > maxContentLength 
                          ? note.content.substring(0, maxContentLength) + '...'
                          : note.content;

                        return (
                          <div 
                            key={note._id} 
                            className="note-item fade-in"
                            onClick={() => editNote(note._id)}
                          >
                            <div className="note-header">
                              <h3 className="note-title">{note.title}</h3>
                              <div className="note-actions">
                                <button 
                                  className="note-btn edit-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editNote(note._id);
                                  }}
                                  title="Edit note"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  className="note-btn delete-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNote(note._id);
                                  }}
                                  title="Delete note"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                            <div className="note-content">{truncatedContent}</div>
                            <div className="note-meta">
                              <i className="fas fa-clock"></i>
                              <span>
                                {isUpdated ? `Updated ${updatedDate}` : `Created ${createdDate}`}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Logger Tab */}
            {activeTab === 'logger' && (
              <div className="tab-content active">
                <div className="logger-view-section">
                  <div className="logger-view-header">
                    <h2>Activity Logs</h2>
                    <div className="logger-view-controls">
                      <select 
                        value={loggerSortOrder}
                        onChange={(e) => setLoggerSortOrder(e.target.value)}
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                      </select>
                      <button onClick={clearAllLogs} className="btn btn-secondary">
                        <i className="fas fa-trash"></i> Clear All
                      </button>
                    </div>
                  </div>
                  
                  <div className="logger-view-container">
                    {sortedLogs.length === 0 ? (
                      <div className="empty-logger-view-state">
                        <i className="fas fa-history"></i>
                        <h3>No logs yet</h3>
                        <p>Start logging your moments and they'll appear here!</p>
                      </div>
                    ) : (
                      sortedLogs.map(log => (
                        <div key={log._id} className="log-item fade-in">
                          <div className="log-item-header">
                            <span className="log-timestamp">{formatLogTime(new Date(log.createdAt))}</span>
                            <button 
                              className="log-delete"
                              onClick={() => deleteLog(log._id)}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                          <div className="log-content">{log.text}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* To-Do List Sidebar */}
          <div className="sidebar">
            <div className="todo-section">
              <div className="todo-header">
                <h2><i className="fas fa-tasks"></i> To-Do List</h2>
                <span>{filteredTodos.length} {currentFilter === 'all' ? 'tasks' : currentFilter === 'completed' ? 'done' : 'pending'}</span>
              </div>

              <div className="todo-form">
                <div className="todo-input-container">
                  <input 
                    type="text" 
                    value={todoInput}
                    onChange={(e) => setTodoInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') addTodo();
                    }}
                    placeholder="Add a new task..." 
                    maxLength="100"
                  />
                  <button onClick={addTodo} className="todo-add-btn">
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>

              <div className="todo-filters">
                <button 
                  className={`filter-btn ${currentFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setCurrentFilter('pending')}
                >
                  Pending
                </button>
                <button 
                  className={`filter-btn ${currentFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setCurrentFilter('completed')}
                >
                  Done
                </button>
                <button 
                  className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCurrentFilter('all')}
                >
                  All
                </button>
              </div>

              <div className="todo-list">
                {filteredTodos.length === 0 ? (
                  <div className="empty-todo-state">
                    <i className="fas fa-clipboard-list"></i>
                    <p>No tasks yet.<br/>Add one above!</p>
                  </div>
                ) : (
                  filteredTodos.map(todo => (
                    <div 
                      key={todo._id} 
                      className={`todo-item ${todo.completed ? 'completed' : ''}`}
                      onClick={() => toggleTodo(todo._id)}
                    >
                      <div 
                        className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTodo(todo._id);
                        }}
                      >
                        <i className="fas fa-check"></i>
                      </div>
                      <div className="todo-text">{todo.text}</div>
                      <button 
                        className="todo-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTodo(todo._id);
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Delete Note</h3>
            <p>Are you sure you want to delete this note? This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 