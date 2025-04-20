let isProcessing = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startProcessing" && !isProcessing) {
    isProcessing = true;
    processForms(message.data);
  }
});

async function processForms(rows) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const homepageUrl = tab.url;

  // 获取所有链接
  const links = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => Array.from(document.querySelectorAll('a')).map(a => a.href)
  });

  for (let i = 0; i < rows.length; i++) {
    // 导航到表单页面
    await chrome.tabs.update(tab.id, { url: links.result[i] });
    await waitForPageLoad(tab.id);

    // 填写表单
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [rows[i]],
      func: (data) => {
        document.querySelector('input[name="field1"]').value = data[0];
        document.querySelector('input[name="field2"]').value = data[1];
        document.querySelector('form').submit();
      }
    });

    // 等待返回主页
    await waitForUrl(tab.id, homepageUrl);
  }
  isProcessing = false;
}

function waitForPageLoad(tabId) {
  return new Promise(resolve => {
    chrome.tabs.onUpdated.addListener(function listener(id, info) {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}

function waitForUrl(tabId, url) {
  return new Promise(resolve => {
    chrome.tabs.onUpdated.addListener(function listener(id, info, tabInfo) {
      if (id === tabId && info.status === 'complete' && tabInfo.url === url) {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}