/* ============================================
   Nexalife - Task Module
   ============================================ */

class TaskManager {
  constructor(db) {
    this.db = db;
  }

  async getAllTasks() {
    const tasks = await this.db.getAll('tasks');
    return tasks.sort((a, b) => {
      const priorityOrder = { tinggi: 1, sedang: 2, rendah: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      return b.id - a.id;
    });
  }

  async addTask(task) {
    const newTask = {
      ...task,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    return await this.db.add('tasks', newTask);
  }

  async updateTask(id, taskData) {
    const existing = await this.db.getById('tasks', id);
    if (!existing) throw new Error('Task not found');
    
    const updated = { ...existing, ...taskData };
    return await this.db.put('tasks', updated);
  }

  async deleteTask(id) {
    return await this.db.delete('tasks', id);
  }

  async toggleTaskStatus(id) {
    const task = await this.db.getById('tasks', id);
    if (!task) throw new Error('Task not found');
    
    task.status = task.status === 'selesai' ? 'pending' : 'selesai';
    return await this.db.put('tasks', task);
  }

  async getTaskStats() {
    const tasks = await this.getAllTasks();
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'selesai').length;
    const pending = total - done;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    
    return { total, done, pending, progress };
  }

  async getOverdueTasks() {
    const tasks = await this.getAllTasks();
    const today = new Date().toISOString().split('T')[0];
    
    return tasks.filter(t => 
      t.status !== 'selesai' && 
      t.deadline && 
      t.deadline < today
    );
  }

  async getTasksByPriority(priority) {
    const tasks = await this.getAllTasks();
    return tasks.filter(t => t.priority === priority);
  }

  async getTasksByStatus(status) {
    const tasks = await this.getAllTasks();
    return tasks.filter(t => t.status === status);
  }
}

// Initialize task manager
const taskManager = new TaskManager(db);
