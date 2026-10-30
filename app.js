(() => {
  'use strict';

  const STORAGE_KEY = 'todo-app.items';

  const form = document.getElementById('new-form');
  const input = document.getElementById('new-input');
  const list = document.getElementById('list');
  const empty = document.getElementById('empty');
  const count = document.getElementById('count');
  const clearDone = document.getElementById('clear-done');
  const filterButtons = document.querySelectorAll('[data-filter]');

  let todos = load();
  let filter = 'all';

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // ストレージが使えない環境ではメモリ上だけで動かす
    }
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function visibleTodos() {
    if (filter === 'active') return todos.filter(t => !t.done);
    if (filter === 'done') return todos.filter(t => t.done);
    return todos;
  }

  function render() {
    list.replaceChildren(...visibleTodos().map(renderItem));

    const remaining = todos.filter(t => !t.done).length;
    count.textContent = `残り ${remaining} 件 / 全 ${todos.length} 件`;
    empty.hidden = list.children.length > 0;
    clearDone.hidden = !todos.some(t => t.done);
  }

  function renderItem(todo) {
    const li = document.createElement('li');
    li.className = 'item' + (todo.done ? ' done' : '');
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.setAttribute('aria-label', '完了');

    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = todo.title;

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'delete';
    del.textContent = '×';
    del.setAttribute('aria-label', '削除');

    li.append(checkbox, title, del);
    return li;
  }

  function findTodo(el) {
    const li = el.closest('.item');
    return li && todos.find(t => t.id === li.dataset.id);
  }

  function startEdit(li, todo) {
    const title = li.querySelector('.title');
    const editor = document.createElement('input');
    editor.type = 'text';
    editor.className = 'edit';
    editor.value = todo.title;
    editor.maxLength = 200;
    title.replaceWith(editor);
    editor.focus();
    editor.select();

    let finished = false;
    const finish = (commit) => {
      if (finished) return;
      finished = true;
      const value = editor.value.trim();
      if (commit) {
        if (value) {
          todo.title = value;
        } else {
          todos = todos.filter(t => t !== todo);
        }
        save();
      }
      render();
    };

    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) finish(true);
      if (e.key === 'Escape') finish(false);
    });
    editor.addEventListener('blur', () => finish(true));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) return;
    todos.push({ id: newId(), title, done: false });
    save();
    input.value = '';
    render();
  });

  list.addEventListener('change', (e) => {
    if (e.target.type !== 'checkbox') return;
    const todo = findTodo(e.target);
    if (!todo) return;
    todo.done = e.target.checked;
    save();
    render();
  });

  list.addEventListener('click', (e) => {
    if (!e.target.classList.contains('delete')) return;
    const todo = findTodo(e.target);
    if (!todo) return;
    todos = todos.filter(t => t !== todo);
    save();
    render();
  });

  list.addEventListener('dblclick', (e) => {
    if (!e.target.classList.contains('title')) return;
    const todo = findTodo(e.target);
    if (todo) startEdit(e.target.closest('.item'), todo);
  });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      filterButtons.forEach(b => b.classList.toggle('active', b === btn));
      render();
    });
  });

  clearDone.addEventListener('click', () => {
    todos = todos.filter(t => !t.done);
    save();
    render();
  });

  // 別タブでの変更を反映
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    todos = load();
    render();
  });

  render();
})();
