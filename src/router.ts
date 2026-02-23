import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AnalysisView from '@/views/AnalysisView.vue'

const router = createRouter({
  // GitHub Pages / Vercel どちらでも動作するようにハッシュモードを使用
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/analysis', name: 'analysis', component: AnalysisView },
  ],
})

export default router
