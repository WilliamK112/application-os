// 用户 profile - 从 JOB_APPLICATION_WORKFLOW_HANDBOOK 提取
const USER_PROFILE = {
  // 基本信息
  name: "Ching-Wei Kang",
  email: "ckang53@wisc.edu",
  password: "Wk11211014!",
  phone: "(347) 866-8326",
  address: "432 W Gorham St, Madison, WI 53703",
  
  // LinkedIn & GitHub
  linkedin: "https://www.linkedin.com/in/kcw2027/",
  github: "https://github.com/kcw2027",
  
  // 教育背景
  school: "University of Wisconsin–Madison",
  educationLevel: "Bachelor's",
  major: "Computer Science / Data Science",
  graduation: "May 2027",
  studentStatus: "Junior",
  
  // 工作授权
  authorizedToWork: "Yes",
  visaSponsorship: "Yes",
  exportControl: "No",
  
  // 其他默认
  veteran: "I am not a veteran",
  disability: "No",
  race: "Asian",
  howHeard: "Professional Job Fair",
  workedHereBefore: "No",
  
  // Resume 文件
  resumeFiles: [
    "Ching-Wei+Kang+UWM 2027_May.pdf",
    "Ching-Wei_Kang+UWM_2027_May.pdf"
  ]
};

// ATS 平台检测
const PLATFORM_DETECTORS = {
  workday: {
    host: /(?:my)?workday\.com$/,
    name: "Workday",
    urlPattern: /myworkdayjobs\.com|workday\.com/,
    selectors: {
      firstName: 'input[name="legalName--firstName"], input[name*="firstName"], input[id*="firstName"]',
      lastName: 'input[name="legalName--lastName"], input[name*="lastName"], input[id*="lastName"]',
      email: 'input[type="email"], input[name*="email"], input[id*="email"]',
      phone: 'input[name="phoneNumber"], input[type="tel"], input[name*="phone"]',
      address: 'input[name="addressLine1"], input[name*="addressLine1"]',
      city: 'input[name="city"], input[name*="city"]',
      state: 'select[name="regionSubdivision1"], select[name*="state"]',
      zip: 'input[name="postalCode"], input[name*="postal"]',
      resume: 'input[type="file"]'
    },
    autofillButtonSelectors: [
      'button[data-automation-id="resumeAutofillButton"]',
      'button:contains("Autofill with Resume")',
      '[data-automation-id*="autofill"]',
      'button:contains("Fill from Profile")',
      'button:contains("Apply with LinkedIn")',
      'button:contains("Import")'
    ]
  },
  greenhouse: {
    host: /greenhouse\.io$/,
    name: "Greenhouse",
    selectors: {
      firstName: 'input[name*="first_name"], #first_name',
      lastName: 'input[name*="last_name"], #last_name',
      email: 'input[type="email"][name*="email"]',
      phone: 'input[type="tel"][name*="phone"]',
      resume: 'input[type="file"]'
    }
  },
  ashby: {
    host: /ashbyhq\.com$/,
    name: "Ashby",
    selectors: {
      firstName: 'input[name*="firstName"], input[id*="firstName"]',
      lastName: 'input[name*="lastName"], input[id*="lastName"]',
      email: 'input[type="email"]',
      phone: 'input[type="tel"]',
      resume: 'input[type="file"]'
    }
  },
  smartrecruiters: {
    host: /smartrecruiters\.com$/,
    name: "SmartRecruiters",
    selectors: {
      firstName: 'input[name*="firstName"], input[id*="firstName"]',
      lastName: 'input[name*="lastName"], input[id*="lastName"]',
      email: 'input[type="email"]',
      phone: 'input[type="tel"]',
      resume: 'input[type="file"]'
    }
  },
  taleo: {
    host: /taleo\.net$/,
    name: "Taleo",
    selectors: {
      firstName: 'input[name*="firstName"], input[id*="firstName"]',
      lastName: 'input[name*="lastName"], input[id*="lastName"]',
      email: 'input[type="email"]',
      phone: 'input[type="tel"]',
      resume: 'input[type="file"]'
    }
  },
  icims: {
    host: /icims\.com$/,
    name: "iCIMS",
    selectors: {
      firstName: 'input[name*="firstName"], input[id*="firstName"]',
      lastName: 'input[name*="lastName"], input[id*="lastName"]',
      email: 'input[type="email"]',
      phone: 'input[type="tel"]',
      resume: 'input[type="file"]'
    }
  }
};

// 检测当前平台
function detectPlatform(url) {
  for (const [key, platform] of Object.entries(PLATFORM_DETECTORS)) {
    // 检查 host 或 urlPattern
    const hostMatch = platform.host && platform.host.test(url);
    const urlMatch = platform.urlPattern && platform.urlPattern.test(url);
    if (hostMatch || urlMatch) {
      return { key, ...platform };
    }
  }
  return null;
}

// 填充表单字段
function fillField(selector, value) {
  const field = document.querySelector(selector);
  if (field) {
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  return false;
}

// 自动填充主函数
async function autofillProfile() {
  const platform = detectPlatform(window.location.href);
  if (!platform) {
    return { success: false, message: "Unsupported platform" };
  }
  
  const nameParts = USER_PROFILE.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Workday 特定的字段映射 (Accenture 测试通过)
  const workdayMappings = {
    'input[name="legalName--firstName"]': firstName,
    'input[name="legalName--lastName"]': lastName,
    'input[name="addressLine1"]': USER_PROFILE.address.split(',')[0].trim(),
    'input[name="city"]': 'Madison',
    'input[name="postalCode"]': '53703',
    'input[name="phoneNumber"]': USER_PROFILE.phone.replace(/[\-\(\)]/g, '')
  };
  
  // 其他平台的默认映射
  const defaultMappings = {
    'input[name*="firstName"]': firstName,
    'input[name*="lastName"]': lastName,
    'input[type="email"]': USER_PROFILE.email,
    'input[type="tel"]': USER_PROFILE.phone
  };
  
  const mappings = platform.key === 'workday' ? workdayMappings : defaultMappings;
  let filled = 0;
  
  for (const [selector, value] of Object.entries(mappings)) {
    const field = document.querySelector(selector);
    if (field && (!field.value || field.value === '')) {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      filled++;
    }
  }
  
  // 处理 State 下拉框
  if (platform.key === 'workday') {
    const stateSelectors = ['select[name="regionSubdivision1"]', 'select[data-automation-id*="region"]'];
    for (const sel of stateSelectors) {
      const stateSelect = document.querySelector(sel);
      if (stateSelect && !stateSelect.value) {
        // 查找 Wisconsin 的 option
        const options = stateSelect.options;
        for (let i = 0; i < options.length; i++) {
          if (options[i].text.includes('Wisconsin')) {
            stateSelect.selectedIndex = i;
            stateSelect.dispatchEvent(new Event('change', { bubbles: true }));
            filled++;
            break;
          }
        }
      }
    }
  }
  
  return { 
    success: true, 
    platform: platform.name,
    filled,
    message: `Filled ${filled} fields on ${platform.name}`
  };
}

// 点击 Workday 的 "Autofill with Resume" 按钮
async function clickResumeAutofill() {
  const platform = detectPlatform(window.location.href);
  if (!platform) {
    return { success: false, message: "Unsupported platform" };
  }
  
  // Workday 特定的 autofill 按钮选择器
  const workdayAutofillSelectors = [
    'button[data-automation-id="resumeAutofillButton"]',
    'button:contains("Autofill with Resume")',
    '[data-automation-id*="autofill"]',
    'button:contains("Fill from Profile")',
    'button:contains("Apply with LinkedIn")'
  ];
  
  for (const selector of workdayAutofillSelectors) {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.click();
      return { success: true, platform: platform.name, message: "Clicked autofill button" };
    }
  }
  
  return { success: false, message: "No autofill button found" };
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "autofill") {
    autofillProfile().then(result => sendResponse(result));
    return true;
  }
  
  if (request.action === "clickResumeAutofill") {
    clickResumeAutofill().then(result => sendResponse(result));
    return true;
  }
  
  if (request.action === "getProfile") {
    sendResponse(USER_PROFILE);
    return true;
  }
  
  if (request.action === "detectPlatform") {
    const platform = detectPlatform(window.location.href);
    sendResponse(platform);
    return true;
  }
});

console.log("[Auto-Apply] Content script loaded for", window.location.hostname);