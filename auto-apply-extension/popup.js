// Popup 逻辑
document.addEventListener('DOMContentLoaded', async () => {
  const platformBadge = document.getElementById('platform');
  const statusArea = document.getElementById('status-area');
  const btnAutofill = document.getElementById('btn-autofill');
  const btnUploadResume = document.getElementById('btn-upload-resume');
  const btnSubmit = document.getElementById('btn-submit');

  // 检测当前平台
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const url = new URL(tab.url);
      const hostname = url.hostname;
      
      const platformMap = {
        'workday.com': 'Workday',
        'greenhouse.io': 'Greenhouse',
        'ashbyhq.com': 'Ashby',
        'smartrecruiters.com': 'SmartRecruiters',
        'taleo.net': 'Taleo',
        'icims.com': 'iCIMS'
      };
      
      let platform = null;
      for (const [key, name] of Object.entries(platformMap)) {
        if (hostname.includes(key.replace('.', ''))) {
          platform = name;
          break;
        }
      }
      
      if (platform) {
        platformBadge.textContent = platform;
        platformBadge.classList.add('active');
      } else {
        platformBadge.textContent = 'Unknown';
      }
    }
  } catch (e) {
    platformBadge.textContent = 'Error';
  }

  // 显示状态消息
  function showStatus(message, type = 'info') {
    statusArea.className = `status ${type}`;
    statusArea.textContent = message;
    statusArea.classList.remove('hidden');
    setTimeout(() => statusArea.classList.add('hidden'), 3000);
  }

  // Auto-fill 按钮
  btnAutofill.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const result = await chrome.tabs.sendMessage(tab.id, { action: 'autofill' });
      
      if (result?.success) {
        showStatus(`✅ ${result.message}`, 'success');
      } else {
        showStatus(`⚠️ ${result?.message || 'Failed to autofill'}`, 'error');
      }
    } catch (e) {
      showStatus('❌ Cannot connect to page. Refresh and try again.', 'error');
    }
  });

  // Resume Autofill 按钮 (Workday 专用)
  document.getElementById('btn-resume-autofill').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const result = await chrome.tabs.sendMessage(tab.id, { action: 'clickResumeAutofill' });
      
      if (result?.success) {
        showStatus(`✅ ${result.message}`, 'success');
      } else {
        showStatus(`⚠️ ${result?.message || 'No autofill button found'}`, 'error');
      }
    } catch (e) {
      showStatus('❌ Cannot connect to page. Refresh and try again.', 'error');
    }
  });

  // Upload Resume 按钮
  btnUploadResume.addEventListener('click', async () => {
    showStatus('📄 Resume upload - configure file path in settings', 'info');
  });

  // Submit 按钮
  btnSubmit.addEventListener('click', async () => {
    showStatus('✅ Submit - manual verification required for v1', 'info');
  });

  // Edit Profile 按钮
  document.getElementById('btn-edit-profile').addEventListener('click', () => {
    showStatus('⚙️ Profile editing coming in v2', 'info');
  });
});