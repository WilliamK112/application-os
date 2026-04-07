// Background service worker
// 处理持久化存储和跨标签页通信

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Auto-Apply] Extension installed");
  
  // 初始化存储
  chrome.storage.sync.set({
    userProfile: {
      name: "Ching-Wei Kang",
      email: "ckang53@wisc.edu",
      phone: "(347) 866-8326",
      address: "432 W Gorham St, Madison, WI 53703",
      school: "University of Wisconsin–Madison",
      major: "Computer Science / Data Science",
      graduation: "May 2027",
      linkedin: "https://www.linkedin.com/in/kcw2027/",
      github: "https://github.com/kcw2027"
    },
    settings: {
      autofillEnabled: true,
      autoUploadResume: true,
      autoSubmit: false
    }
  });
});

// 监听消息转发
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "log") {
    console.log("[Auto-Apply]", request.message);
    sendResponse({ success: true });
  }
  return true;
});

// 点击扩展图标时显示 popup
chrome.action.onClicked.addListener((tab) => {
  // 已经在 popup 中处理，不需要额外逻辑
});