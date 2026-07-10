<script setup lang="ts">
import { reactive, ref } from 'vue';
import { LockOutlined, UserOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const emit = defineEmits<{ (e: 'success'): void }>();

const ACCOUNT = 'admin';
const PASSWORD = 'admin123';

const form = reactive({
  username: 'admin',
  password: 'admin123',
  remember: true
});
const showPassword = ref(false);

const saved = localStorage.getItem('dakafleet-auth-user');
if (saved) form.username = saved;

const brandTags = ['数据零录入', '帮调度运营', '财务全自动'];

function handleLogin() {
  if (!form.username.trim() || !form.password) {
    message.warning('请输入账号和密码');
    return;
  }
  if (form.username.trim() !== ACCOUNT || form.password !== PASSWORD) {
    message.error('账号或密码错误');
    return;
  }
  if (form.remember) {
    localStorage.setItem('dakafleet-auth', '1');
    localStorage.setItem('dakafleet-auth-user', form.username.trim());
  } else {
    localStorage.removeItem('dakafleet-auth-user');
  }
  message.success('登录成功');
  emit('success');
}

function forgotPassword() {
  message.info('请联系系统管理员重置密码');
}
</script>

<template>
  <div class="login-page">
    <div class="login-shell">
      <!-- 左侧品牌，文字直接叠在夜景背景上 -->
      <section class="login-brand">
        <div class="brand-logo">
          <span class="brand-logo-mark">卡</span>
          <span class="brand-logo-text">大卡车队</span>
        </div>
        <h1 class="brand-title">大卡车队<br />管理系统</h1>
        <p class="brand-subtitle">一站式车队管理系统</p>
        <div class="brand-tags">
          <span
            v-for="(tag, i) in brandTags"
            :key="tag"
            class="brand-tag"
            :class="{ highlight: i === 0 }"
          >{{ tag }}</span>
        </div>
      </section>

      <!-- 右侧玻璃拟态登录卡片 -->
      <section class="login-card">
        <h2 class="login-title">欢迎登录</h2>
        <p class="login-sub">请输入账号密码登录系统</p>

        <label class="login-field">
          <span>账号</span>
          <div class="login-input">
            <UserOutlined class="login-input-icon" />
            <input v-model="form.username" type="text" placeholder="请输入账号" @keydown.enter="handleLogin" />
          </div>
        </label>

        <label class="login-field">
          <span>密码</span>
          <div class="login-input">
            <LockOutlined class="login-input-icon" />
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              @keydown.enter="handleLogin"
            />
            <button type="button" class="login-eye" @click="showPassword = !showPassword">
              <component :is="showPassword ? EyeOutlined : EyeInvisibleOutlined" />
            </button>
          </div>
        </label>

        <div class="login-options">
          <label class="login-remember">
            <input v-model="form.remember" type="checkbox" />
            <span>记住我</span>
          </label>
          <button type="button" class="login-forgot" @click="forgotPassword">忘记密码？</button>
        </div>

        <button type="button" class="login-submit" @click="handleLogin">登 录</button>

        <p class="login-footer">© 2026 大卡车队 · 一体化一站式车队管理系统</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  /* 物流车队实景背景图（Unsplash 公开图，可替换为本地图） */
  background-image: url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=2100&q=80');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
/* 深蓝渐变叠层：左侧偏暗保证白字可读 */
.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, rgba(15, 30, 55, 0.92) 0%, rgba(20, 42, 74, 0.76) 44%, rgba(18, 38, 66, 0.5) 100%);
  z-index: 1;
}
/* 底部地面暗化 */
.login-page::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(10, 22, 40, 0) 45%, rgba(8, 16, 30, 0.7) 100%);
  z-index: 1;
}

.login-shell {
  position: relative;
  z-index: 2;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 64px;
  gap: 48px;
}

/* 左侧品牌 */
.login-brand {
  flex: 1 1 auto;
  max-width: 560px;
  color: #fff;
}
.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 44px;
}
.brand-logo-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: linear-gradient(135deg, #d4a853, #ffd966);
  color: #1e3a5f;
  font-size: 22px;
  font-weight: 800;
}
.brand-logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 2px;
}
.brand-title {
  margin: 0;
  font-size: 54px;
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: 3px;
  text-shadow: 0 6px 30px rgba(0, 0, 0, 0.35);
}
.brand-subtitle {
  margin: 24px 0 30px;
  font-size: 16px;
  color: #ffd966;
  letter-spacing: 1px;
}
.brand-tags {
  display: flex;
  gap: 14px;
}
.brand-tag {
  padding: 9px 22px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  color: #dfe7f2;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(6px);
}
.brand-tag.highlight {
  color: #ffd966;
  border-color: rgba(212, 168, 83, 0.75);
  background: rgba(212, 168, 83, 0.14);
}

/* 右侧玻璃卡片 */
.login-card {
  flex: 0 0 auto;
  width: 480px;
  max-width: 42vw;
  padding: 44px 46px 30px;
  border-radius: 22px;
  background: rgba(28, 44, 70, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 30px 70px rgba(6, 14, 28, 0.5);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  color: #fff;
}
.login-title {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: #fff;
}
.login-sub {
  margin: 12px 0 30px;
  font-size: 14px;
  color: #b9c6da;
}
.login-field {
  display: block;
  margin-bottom: 22px;
}
.login-field > span {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #d3ddec;
}
.login-input {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 54px;
  padding: 0 18px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.login-input:focus-within {
  border-color: #4d8bff;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 0 3px rgba(77, 139, 255, 0.25);
}
.login-input-icon {
  font-size: 17px;
  color: rgba(255, 255, 255, 0.7);
}
.login-input input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #fff;
}
.login-input input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}
.login-eye {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  cursor: pointer;
  display: inline-flex;
  font-size: 16px;
}
.login-eye:hover {
  color: #fff;
}
.login-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}
.login-remember {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #d3ddec;
  cursor: pointer;
}
.login-remember input {
  width: 16px;
  height: 16px;
  accent-color: #1a5fd9;
  cursor: pointer;
}
.login-forgot {
  border: none;
  background: transparent;
  color: #6ea3ff;
  font-size: 14px;
  cursor: pointer;
}
.login-forgot:hover {
  text-decoration: underline;
}
.login-submit {
  width: 100%;
  height: 54px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(90deg, #1a5fd9 0%, #4d8bff 100%);
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 8px;
  cursor: pointer;
  box-shadow: 0 14px 30px rgba(26, 95, 217, 0.4);
  transition: transform 0.12s, box-shadow 0.12s;
}
.login-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 38px rgba(26, 95, 217, 0.5);
}
.login-submit:active {
  transform: translateY(0);
}
.login-footer {
  margin: 26px 0 0;
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}

@media (max-width: 960px) {
  .login-shell {
    justify-content: center;
    padding: 0 20px;
  }
  .login-brand {
    display: none;
  }
  .login-card {
    width: 100%;
    max-width: 440px;
    padding: 40px 28px 28px;
  }
}
</style>
