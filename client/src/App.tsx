import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, CalendarDays, Check, CheckCircle2, Circle, Clock3,
  ListTodo, LogOut, Plus, Search, SlidersHorizontal, Sparkles,
  Trash2, X, Pencil, LoaderCircle
} from 'lucide-react';
import { api, clearSession, getErrorMessage, saveSession } from './api';

type User = { id: string; name: string; email: string };
type Task = {
  _id: string; title: string; description: string; completed: boolean;
  priority: 'Low' | 'Medium' | 'High'; dueDate: string; createdAt: string;
};
type Filter = 'All tasks' | 'Today' | 'Upcoming' | 'Completed';
const filters: Filter[] = ['All tasks', 'Today', 'Upcoming', 'Completed'];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>('All tasks');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const loadTasks = useCallback(async () => {
    const response = await api.get('/tasks');
    setTasks(response.data.tasks);
  }, []);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('daymark_token');
    if (!token) { setAuthReady(true); return; }
    api.get('/auth/me')
      .then(async response => {
        if (!active) return;
        setUser(response.data.user);
        const taskResponse = await api.get('/tasks');
        if (active) setTasks(taskResponse.data.tasks);
      })
      .catch(() => { clearSession(); if (active) setUser(null); })
      .finally(() => { if (active) setAuthReady(true); });
    return () => { active = false; };
  }, []);

  const today = new Date().toLocaleDateString('en-CA');
  const completedCount = tasks.filter(task => task.completed).length;
  const pendingCount = tasks.length - completedCount;
  const progress = tasks.length ? Math.round(completedCount / tasks.length * 100) : 0;

  const visibleTasks = useMemo(() => tasks.filter(task => {
    const matchesSearch = `${task.title} ${task.description}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter =
      filter === 'All tasks' ||
      (filter === 'Today' && task.dueDate === today && !task.completed) ||
      (filter === 'Upcoming' && !!task.dueDate && task.dueDate > today && !task.completed) ||
      (filter === 'Completed' && task.completed);
    return matchesSearch && matchesFilter;
  }).sort((a, b) => Number(a.completed) - Number(b.completed) ||
    (a.dueDate || '9999').localeCompare(b.dueDate || '9999')), [tasks, filter, query, today]);

  async function handleAuth(event: FormEvent) {
    event.preventDefault(); setAuthBusy(true); setError('');
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload = authMode === 'login'
        ? { email: authEmail, password: authPassword }
        : { name: authName, email: authEmail, password: authPassword };
      const response = await api.post(endpoint, payload);
      saveSession(response.data.token);
      setUser(response.data.user);
      setTasks([]);
      await loadTasks();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setAuthBusy(false); setAuthReady(true); }
  }

  function openNewTask() {
    setEditing(null); setTitle(''); setDescription('');
    setPriority('Medium'); setDueDate(''); setError(''); setShowForm(true);
  }
  function openEditTask(task: Task) {
    setEditing(task); setTitle(task.title); setDescription(task.description || '');
    setPriority(task.priority); setDueDate(task.dueDate || ''); setError(''); setShowForm(true);
  }
  async function saveTask(event: FormEvent) {
    event.preventDefault(); if (!title.trim()) return;
    setBusy(true); setError('');
    try {
      const payload = { title: title.trim(), description: description.trim(), priority, dueDate };
      if (editing) await api.patch(`/tasks/${editing._id}`, payload);
      else await api.post('/tasks', payload);
      await loadTasks(); setShowForm(false);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  }
  async function toggleTask(task: Task) {
    try { await api.patch(`/tasks/${task._id}`, { completed: !task.completed }); await loadTasks(); }
    catch (err) { setError(getErrorMessage(err)); }
  }
  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try { await api.delete(`/tasks/${task._id}`); await loadTasks(); }
    catch (err) { setError(getErrorMessage(err)); }
  }
  function signOut() {
    clearSession(); setUser(null); setTasks([]); setFilter('All tasks');
    setAuthEmail(''); setAuthPassword(''); setError('');
  }

  if (!authReady) return <main className="loading-screen"><div className="brand-mark"><ListTodo size={22} /></div><p>Getting your workspace ready…</p></main>;

  if (!user) return (
    <main className="login-screen">
      <div className="login-art">
        <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
        <div className="art-note"><CheckCircle2 size={20} /> One thing at a time.</div>
        <div className="art-card">
          <div className="art-card-top"><span>YOUR DAY, IN FOCUS</span><Sparkles size={16} /></div>
          <div className="art-line wide" /><div className="art-line" />
          <div className="art-task"><Check size={15} /> Plan the important things</div>
          <div className="art-task muted"><Circle size={15} /> Make room for good work</div>
          <div className="art-progress"><i /></div><small>Progress looks good</small>
        </div>
        <p className="art-caption">Less juggling.<br /><em>More doing.</em></p>
      </div>
      <section className="login-panel">
        <div className="brand"><div className="brand-mark"><ListTodo size={21} /></div><span>daymark</span></div>
        <div className="login-copy">
          <span className="eyebrow">A CLEARER KIND OF PRODUCTIVITY</span>
          <h1>{authMode === 'login' ? <>Make space for<br /><em>what matters.</em></> : <>Start with a<br /><em>clear day.</em></>}</h1>
          <p>Your tasks, priorities, and plans — all in one calm place.</p>
          <form className="auth-form" onSubmit={handleAuth}>
            {authMode === 'register' && <label>Your name<input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Your name" required minLength={2} maxLength={60} /></label>}
            <label>Email address<input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="you@example.com" required /></label>
            <label>Password<input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} /></label>
            {error && <p className="error-text">{error}</p>}
            <button className="primary-btn login-btn" disabled={authBusy}>
              {authBusy ? <LoaderCircle className="spin" size={17} /> : authMode === 'login' ? 'Sign in to your workspace' : 'Create your account'}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {authMode === 'login' ? 'New to Daymark?' : 'Already have an account?'}
            <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}>
              {authMode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </div>
        <div className="login-foot">Private by design <span>·</span> Made for focused days</div>
      </section>
    </main>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><ListTodo size={21} /></div><span>daymark</span></div>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          {filters.map((item, index) => {
            const Icon = [ListTodo, CalendarDays, Clock3, CheckCircle2][index];
            const count = index === 0 ? tasks.length : index === 1
              ? tasks.filter(t => t.dueDate === today && !t.completed).length
              : index === 2 ? tasks.filter(t => t.dueDate && t.dueDate > today && !t.completed).length : completedCount;
            return <button key={item} className={filter === item ? 'nav-item active' : 'nav-item'} onClick={() => setFilter(item)}>
              <Icon size={17} /><span>{item}</span><small>{count}</small>
            </button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="focus-card"><Sparkles size={17} /><strong>Keep your focus</strong>
            <p>Small steps add up to meaningful progress.</p>
            <div className="focus-track"><i style={{ width: `${progress}%` }} /></div>
            <small>{progress}% of tasks completed</small>
          </div>
          <button className="profile-row" onClick={signOut}>
            <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
            <span><strong>{user.name}</strong><small>{user.email}</small></span><LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div><span className="eyebrow">YOUR PERSONAL WORKSPACE</span><h1>{filter}</h1></div>
          <div className="top-actions">
            <span className="today-label"><CalendarDays size={15} />{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <button className="primary-btn" onClick={openNewTask}><Plus size={17} /> New task</button>
          </div>
        </header>

        <section className="welcome-row">
          <div><h2>A little progress goes a long way.</h2><p>Here’s what your day is looking like.</p></div>
          <div className="progress-summary">
            <div className="progress-ring" style={{ background: `conic-gradient(#58745f ${progress}%, #e8ece7 ${progress}%)` }}><div>{progress}<small>%</small></div></div>
            <span><strong>{completedCount} of {tasks.length}</strong><small>tasks completed</small></span>
          </div>
        </section>

        <section className="stat-grid">
          <div className="stat-card"><div className="stat-icon sage"><ListTodo size={18} /></div><span>ALL TASKS</span><strong>{tasks.length}</strong><small>Total in your workspace</small></div>
          <div className="stat-card"><div className="stat-icon amber"><Clock3 size={18} /></div><span>TO DO</span><strong>{pendingCount}</strong><small>Ready when you are</small></div>
          <div className="stat-card"><div className="stat-icon blue"><CheckCircle2 size={18} /></div><span>COMPLETED</span><strong>{completedCount}</strong><small>Look at you go</small></div>
        </section>

        <section className="tasks-section">
          <div className="section-heading">
            <div><span className="eyebrow">YOUR LIST</span><h2>{filter === 'All tasks' ? 'Tasks that matter' : filter}</h2></div>
            <div className="task-tools">
              <div className="search-box"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tasks" /></div>
              <span className="task-count"><SlidersHorizontal size={15} /> {visibleTasks.length} shown</span>
            </div>
          </div>
          {error && <div className="error-banner">{error}<button onClick={() => setError('')}><X size={15} /></button></div>}
          {visibleTasks.length ? <div className="task-list">
            {visibleTasks.map(task => <article className={task.completed ? 'task-row is-done' : 'task-row'} key={task._id}>
              <button className="check-btn" onClick={() => toggleTask(task)} aria-label="Toggle completion">{task.completed ? <CheckCircle2 size={21} /> : <Circle size={21} />}</button>
              <button className="task-main" onClick={() => openEditTask(task)}><strong>{task.title}</strong>{task.description && <small>{task.description}</small>}</button>
              <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
              {task.dueDate && <span className="due-date"><CalendarDays size={14} />{new Date(`${task.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
              <div className="row-actions"><button onClick={() => openEditTask(task)} aria-label="Edit task"><Pencil size={14} /></button><button onClick={() => deleteTask(task)} aria-label="Delete task"><Trash2 size={15} /></button></div>
            </article>)}
          </div> : <div className="empty-state">
            <div className="empty-icon"><CheckCircle2 size={25} /></div>
            <h3>{query ? 'No matching tasks' : filter === 'Completed' ? 'Nothing completed just yet' : 'A fresh page.'}</h3>
            <p>{query ? 'Try another search term.' : 'Add a task to give your day a little direction.'}</p>
            {!query && <button className="primary-btn" onClick={openNewTask}><Plus size={16} /> Add your first task</button>}
          </div>}
        </section>
        <footer className="page-footer">A calmer way to get things done <span>✳</span></footer>
      </main>

      {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
        <form className="task-modal" onSubmit={saveTask}>
          <div className="modal-heading"><div><span className="eyebrow">{editing ? 'MAKE A CHANGE' : 'MAKE IT HAPPEN'}</span><h2>{editing ? 'Edit task' : 'A new task'}</h2></div><button type="button" className="close-btn" onClick={() => setShowForm(false)}><X size={19} /></button></div>
          <label>Task title<input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to get done?" required maxLength={120} /></label>
          <label>Notes <span className="optional">OPTIONAL</span><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add a little more detail…" rows={3} maxLength={500} /></label>
          <div className="form-grid">
            <label>Priority<select value={priority} onChange={e => setPriority(e.target.value as Task['priority'])}><option>Low</option><option>Medium</option><option>High</option></select></label>
            <label>Due date <span className="optional">OPTIONAL</span><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></label>
          </div>
          <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-btn" disabled={busy || !title.trim()}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create task'} <ArrowRight size={16} /></button></div>
        </form>
      </div>}
    </div>
  );
}