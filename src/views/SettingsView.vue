<template>
  <div class="settings-container">
    <header class="page-header">
      <h1>설정</h1>
    </header>

    <main class="settings-content">
      <div class="settings-sidebar">
        <ul class="settings-nav">
          <li>
            <router-link to="/settings/profile" class="settings-nav-item">
              <span class="settings-nav-icon">👤</span>
              <span>프로필 설정</span>
            </router-link>
          </li>
          <li>
            <router-link to="/settings/naver" class="settings-nav-item">
              <span class="settings-nav-icon">🔌</span>
              <span>네이버 API 연동</span>
            </router-link>
          </li>
          <li>
            <router-link to="/settings/smtp" class="settings-nav-item">
              <span class="settings-nav-icon">✉️</span>
              <span>SMTP 설정</span>
            </router-link>
          </li>
        </ul>
      </div>

      <div class="settings-main">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.settings-container {
  padding: 2rem;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 2rem;
}

h1 {
  font-size: 1.8rem;
  margin: 0;
  color: #333;
}

.settings-content {
  display: flex;
  gap: 2rem;
}

.settings-sidebar {
  width: 250px;
  flex-shrink: 0;
}

.settings-nav {
  list-style: none;
  padding: 0;
  margin: 0;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.settings-nav-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  color: #555;
  text-decoration: none;
  gap: 0.8rem;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.settings-nav-item:hover, .router-link-active {
  background-color: #f0f4ff;
  color: #4a6cf7;
  border-left-color: #4a6cf7;
}

.settings-nav-icon {
  font-size: 1.2rem;
}

.settings-main {
  flex: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .settings-content {
    flex-direction: column;
  }

  .settings-sidebar {
    width: 100%;
  }
}
</style>
