/* ============================================
   Nexalife - Main Application Entry
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Dark mode - baca localStorage dulu (cepat), lalu sync dari DB
  const savedDarkMode = localStorage.getItem('nexalife-dark-mode');
  if (savedDarkMode === '1') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (savedDarkMode === '0') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  
  // Setup navigation
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const pageId = item.dataset.page;
      ui.loadPage(pageId);
    });
  });
  
  // Load default page
  ui.loadPage('dashboard');
  
  // Check deadlines periodically
  setInterval(async () => {
    const overdueTasks = await taskManager.getOverdueTasks();
    if (overdueTasks.length > 0 && ui.currentPage !== 'tasks') {
      ui.showToast(`${overdueTasks.length} tugas melewati deadline!`, 'warning');
    }
  }, 3600000); // Check every hour
});
