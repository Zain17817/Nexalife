/* ============================================
   Nexalife - Chart.js Default Configuration
   ============================================ */

if (typeof Chart !== 'undefined') {
  Chart.defaults.font.family = 'Inter, -apple-system, sans-serif';
  Chart.defaults.font.size = 12;
  Chart.defaults.color = '#64748B';

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    Chart.defaults.color = '#94A3B8';
  }
}