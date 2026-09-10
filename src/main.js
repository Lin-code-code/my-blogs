import { createApp } from 'vue'
// 按需注册用到的 Element Plus 组件，避免全量引入带来的体积膨胀
import {
  ElButton,
  ElCard,
  ElCheckTag,
  ElEmpty,
  ElIcon,
  ElInput,
  ElOption,
  ElResult,
  ElSelect,
  ElTag,
  ElTooltip,
} from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import router from './router/index.js'
import './styles/main.css'

const app = createApp(App)

const components = [
  ElButton,
  ElCard,
  ElCheckTag,
  ElEmpty,
  ElIcon,
  ElInput,
  ElOption,
  ElResult,
  ElSelect,
  ElTag,
  ElTooltip,
]
components.forEach((component) => app.component(component.name, component))

app.use(router)
app.mount('#app')
