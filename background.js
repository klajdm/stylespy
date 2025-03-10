// Add debug logging
console.log("Background script loaded");

let lastDetails = null;
let isInspectorActive = false;

// Function to ensure content script is loaded and send message
async function ensureContentScriptAndSendMessage(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "PING" });
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    console.log("Content script not loaded, injecting...");
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["content.js"],
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    return await chrome.tabs.sendMessage(tabId, message);
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  console.log("Extension icon clicked for tab:", tab.id);

  try {
    isInspectorActive = !isInspectorActive;
    console.log("Toggling inspector to:", isInspectorActive);

    // Send toggle message to content script
    await ensureContentScriptAndSendMessage(tab.id, {
      action: "toggleInspector",
      state: isInspectorActive,
    });

    // Update icon - use color version when active
    await chrome.action.setIcon({
      path: isInspectorActive
        ? {
            16: "icons/icon-color16.png",
            48: "icons/icon-color48.png",
            128: "icons/icon-color128.png",
          }
        : {
            16: "icons/icon16.png",
            48: "icons/icon48.png",
            128: "icons/icon128.png",
          },
      tabId: tab.id,
    });
  } catch (error) {
    console.error("Error in click handler:", error);
    isInspectorActive = !isInspectorActive;
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request.action, "from tab:", sender.tab?.id);

  if (request.action === "showDetails") {
    lastDetails = request.data;
    console.log("Received details:", lastDetails);

    // Insert CSS for the iframe container if not already done
    chrome.scripting.insertCSS({
      target: { tabId: sender.tab.id },
      css: `
        #style-spy-container {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 400px;
          height: 600px;
          z-index: 2147483647;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        #style-spy-header {
          height: 32px;
          background: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
          padding: 0 12px;
          cursor: move;
          user-select: none;
          justify-content: space-between;
        }
        #style-spy-title {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #444;
        }
        #style-spy-close {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 4px;
          color: #666;
          font-family: system-ui;
          font-size: 16px;
        }
        #style-spy-close:hover {
          background: #e9ecef;
          color: #000;
        }
        #style-spy-iframe {
          width: 100%;
          flex: 1;
          border: none;
        }
      `,
    });

    // Get the extension's popup URL
    const popupUrl = chrome.runtime.getURL("popup.html");

    // Insert the iframe with header
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: (popupUrl) => {
        let container = document.getElementById("style-spy-container");
        if (!container) {
          container = document.createElement("div");
          container.id = "style-spy-container";

          // Create header
          const header = document.createElement("div");
          header.id = "style-spy-header";

          const title = document.createElement("div");
          title.id = "style-spy-title";
          title.textContent = "StyleSpy";

          const closeBtn = document.createElement("div");
          closeBtn.id = "style-spy-close";
          closeBtn.innerHTML = "×";
          closeBtn.onclick = () => container.remove();

          header.appendChild(title);
          header.appendChild(closeBtn);

          const iframe = document.createElement("iframe");
          iframe.id = "style-spy-iframe";
          iframe.src = popupUrl;

          container.appendChild(header);
          container.appendChild(iframe);
          document.body.appendChild(container);

          // Make container draggable
          let isDragging = false;
          let currentX;
          let currentY;
          let initialX;
          let initialY;
          let xOffset = 0;
          let yOffset = 0;

          header.onmousedown = dragStart;
          document.onmousemove = drag;
          document.onmouseup = dragEnd;

          function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === header) {
              isDragging = true;
            }
          }

          function drag(e) {
            if (isDragging) {
              e.preventDefault();
              currentX = e.clientX - initialX;
              currentY = e.clientY - initialY;
              xOffset = currentX;
              yOffset = currentY;

              container.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
          }

          function dragEnd() {
            isDragging = false;
          }
        }
      },
      args: [popupUrl],
    });

    // Send details to the content script
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "updateDetails",
      data: lastDetails,
    });
  }

  if (request.action === "getDetails") {
    console.log("Sending details to popup");
    sendResponse({ data: lastDetails });
    return true;
  }
});
