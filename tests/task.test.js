import { describe, it, expect, beforeEach } from 'vitest'

class MockDb {
  constructor() {
    this.tables = { tasks: [] }
    this.sequences = { tasks: 0 }
  }

  getAll(table) {
    return [...this.tables[table]]
  }

  getById(table, id) {
    return this.tables[table].find(r => r.id === id) || null
  }

  add(table, data) {
    this.sequences[table]++
    const row = { id: this.sequences[table], ...data }
    this.tables[table].push(row)
    return row.id
  }

  put(table, data) {
    const idx = this.tables[table].findIndex(r => r.id === data.id)
    if (idx >= 0) {
      this.tables[table][idx] = data
    } else {
      this.sequences[table]++
      data.id = this.sequences[table]
      this.tables[table].push(data)
    }
    return data.id
  }

  delete(table, id) {
    this.tables[table] = this.tables[table].filter(r => r.id !== id)
    return 1
  }
}

class TaskManager {
  constructor(db) {
    this.db = db
  }

  async getAllTasks() {
    const tasks = await this.db.getAll('tasks')
    return tasks.sort((a, b) => {
      const priorityOrder = { tinggi: 1, sedang: 2, rendah: 3 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline)
      }
      return b.id - a.id
    })
  }

  async addTask(task) {
    const newTask = { ...task, status: 'pending', created_at: new Date().toISOString() }
    return await this.db.add('tasks', newTask)
  }

  async updateTask(id, taskData) {
    const existing = await this.db.getById('tasks', id)
    if (!existing) throw new Error('Task not found')
    const updated = { ...existing, ...taskData }
    return await this.db.put('tasks', updated)
  }

  async deleteTask(id) {
    return await this.db.delete('tasks', id)
  }

  async toggleTaskStatus(id) {
    const task = await this.db.getById('tasks', id)
    if (!task) throw new Error('Task not found')
    task.status = task.status === 'selesai' ? 'pending' : 'selesai'
    return await this.db.put('tasks', task)
  }

  async getTaskStats() {
    const tasks = await this.getAllTasks()
    const total = tasks.length
    const done = tasks.filter(t => t.status === 'selesai').length
    const pending = total - done
    const progress = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, done, pending, progress }
  }

  async getOverdueTasks() {
    const tasks = await this.getAllTasks()
    const today = new Date().toISOString().split('T')[0]
    return tasks.filter(t => t.status !== 'selesai' && t.deadline && t.deadline < today)
  }

  async getTasksByPriority(priority) {
    const tasks = await this.getAllTasks()
    return tasks.filter(t => t.priority === priority)
  }

  async getTasksByStatus(status) {
    const tasks = await this.getAllTasks()
    return tasks.filter(t => t.status === status)
  }
}

describe('TaskManager', () => {
  let db
  let taskManager

  beforeEach(() => {
    db = new MockDb()
    taskManager = new TaskManager(db)
  })

  it('should add a task', async () => {
    const id = await taskManager.addTask({
      title: 'Test Task',
      description: 'Test',
      priority: 'tinggi',
      deadline: '2026-07-01'
    })
    expect(id).toBe(1)
    const tasks = await taskManager.getAllTasks()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('Test Task')
  })

  it('should add multiple tasks and sort by priority', async () => {
    await taskManager.addTask({ title: 'Low', priority: 'rendah', deadline: '2026-07-01' })
    await taskManager.addTask({ title: 'High', priority: 'tinggi', deadline: '2026-07-01' })
    await taskManager.addTask({ title: 'Mid', priority: 'sedang', deadline: '2026-07-01' })

    const tasks = await taskManager.getAllTasks()
    expect(tasks).toHaveLength(3)
    expect(tasks[0].title).toBe('High')
    expect(tasks[1].title).toBe('Mid')
    expect(tasks[2].title).toBe('Low')
  })

  it('should update a task', async () => {
    const id = await taskManager.addTask({ title: 'Original', priority: 'sedang' })
    await taskManager.updateTask(id, { title: 'Updated' })
    const tasks = await taskManager.getAllTasks()
    expect(tasks[0].title).toBe('Updated')
  })

  it('should throw on update non-existent task', async () => {
    await expect(taskManager.updateTask(999, { title: 'x' })).rejects.toThrow('Task not found')
  })

  it('should delete a task', async () => {
    await taskManager.addTask({ title: 'To Delete', priority: 'rendah' })
    await taskManager.deleteTask(1)
    const tasks = await taskManager.getAllTasks()
    expect(tasks).toHaveLength(0)
  })

  it('should toggle task status', async () => {
    const id = await taskManager.addTask({ title: 'Toggle Me', priority: 'sedang' })
    let tasks = await taskManager.getAllTasks()
    expect(tasks[0].status).toBe('pending')

    await taskManager.toggleTaskStatus(id)
    tasks = await taskManager.getAllTasks()
    expect(tasks[0].status).toBe('selesai')

    await taskManager.toggleTaskStatus(id)
    tasks = await taskManager.getAllTasks()
    expect(tasks[0].status).toBe('pending')
  })

  it('should compute task stats correctly', async () => {
    await taskManager.addTask({ title: 'Task 1', priority: 'tinggi' })
    await taskManager.addTask({ title: 'Task 2', priority: 'sedang' })

    let stats = await taskManager.getTaskStats()
    expect(stats.total).toBe(2)
    expect(stats.done).toBe(0)
    expect(stats.pending).toBe(2)
    expect(stats.progress).toBe(0)

    await taskManager.toggleTaskStatus(1)
    stats = await taskManager.getTaskStats()
    expect(stats.done).toBe(1)
    expect(stats.pending).toBe(1)
    expect(stats.progress).toBe(50)
  })

  it('should detect overdue tasks', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    await taskManager.addTask({ title: 'Overdue', priority: 'tinggi', deadline: yesterdayStr })
    await taskManager.addTask({ title: 'Not Overdue', priority: 'rendah', deadline: tomorrowStr })
    await taskManager.addTask({ title: 'Done Overdue', priority: 'sedang', deadline: yesterdayStr })

    // Mark third task as done
    await taskManager.toggleTaskStatus(3)

    const overdue = await taskManager.getOverdueTasks()
    expect(overdue).toHaveLength(1)
    expect(overdue[0].title).toBe('Overdue')
  })

  it('should filter tasks by priority', async () => {
    await taskManager.addTask({ title: 'High', priority: 'tinggi' })
    await taskManager.addTask({ title: 'Low', priority: 'rendah' })
    await taskManager.addTask({ title: 'High 2', priority: 'tinggi' })

    const highTasks = await taskManager.getTasksByPriority('tinggi')
    expect(highTasks).toHaveLength(2)
    // Sorted by reverse ID within same priority
    expect(highTasks.map(t => t.title)).toEqual(['High 2', 'High'])
  })

  it('should filter tasks by status', async () => {
    await taskManager.addTask({ title: 'Pending', priority: 'sedang' })
    await taskManager.addTask({ title: 'To Complete', priority: 'tinggi' })

    await taskManager.toggleTaskStatus(2)

    const doneTasks = await taskManager.getTasksByStatus('selesai')
    expect(doneTasks).toHaveLength(1)
    expect(doneTasks[0].title).toBe('To Complete')
  })
})
