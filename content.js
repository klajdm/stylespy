// Add more visible console logging
console.log(
  "%c Element Inspector content script loaded ",
  "background: #222; color: #bada55"
);

let highlightedElement = null;
let originalOutline = null;
let isInspectorEnabled = false;

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(
    "%c Message received in content script ",
    "background: #222; color: #bada55",
    request
  );

  // Handle ping message
  if (request.type === "PING") {
    sendResponse({ status: "ALIVE" });
    return true;
  }

  if (request.action === "toggleInspector") {
    console.log("Toggle inspector to:", request.state);
    if (request.state) {
      enableInspector();
    } else {
      disableInspector();
    }
    sendResponse({
      status: request.state ? "Inspector enabled" : "Inspector disabled",
    });
  }

  if (request.action === "updateDetails") {
    updateIframeContent(request.data);
  }

  return true;
});

function updateIframeContent(data) {
  const iframe = document.querySelector("#style-spy-iframe");
  if (iframe) {
    iframe.contentWindow.postMessage({ type: "UPDATE_DETAILS", data }, "*");
  }
}

// Check if element is part of our UI
function isPartOfUI(element) {
  const container = document.getElementById("style-spy-container");
  return container && (container === element || container.contains(element));
}

// Prevent all events when inspector is enabled
function preventDefault(e) {
  if (isInspectorEnabled && !isPartOfUI(e.target)) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

function enableInspector() {
  console.log("Enabling inspector...");
  isInspectorEnabled = true;

  // Remove existing listeners first to prevent duplicates
  removeAllListeners();

  // Add event prevention listeners
  const eventsToPrevent = [
    "click",
    "mousedown",
    "mouseup",
    "submit",
    "keydown",
    "keyup",
    "keypress",
    "touchstart",
    "touchend",
    "touchmove",
    "drag",
    "dragstart",
    "drop",
    "input",
    "change",
    "focus",
    "blur",
    "scroll",
    "contextmenu",
  ];

  eventsToPrevent.forEach((eventType) => {
    document.addEventListener(eventType, preventDefault, true);
  });

  // Add inspector listeners
  document.addEventListener("mousemove", handleMouseMove, true);
  document.addEventListener("click", handleClick, true);

  // Add visual indicator that inspector is active
  const style = document.createElement("style");
  style.id = "style-spy-cursor";
  style.textContent = `
    body.style-spy-active, 
    body.style-spy-active *:not(#style-spy-container):not(#style-spy-container *) {
      cursor: crosshair !important;
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(style);
  document.body.classList.add("style-spy-active");
}

function removeAllListeners() {
  const eventsToRemove = [
    "click",
    "mousedown",
    "mouseup",
    "submit",
    "keydown",
    "keyup",
    "keypress",
    "touchstart",
    "touchend",
    "touchmove",
    "drag",
    "dragstart",
    "drop",
    "input",
    "change",
    "focus",
    "blur",
    "scroll",
    "contextmenu",
  ];

  eventsToRemove.forEach((eventType) => {
    document.removeEventListener(eventType, preventDefault, true);
  });

  document.removeEventListener("mousemove", handleMouseMove, true);
  document.removeEventListener("click", handleClick, true);
}

function disableInspector() {
  console.log("Disabling inspector...");
  isInspectorEnabled = false;

  // Remove all listeners
  removeAllListeners();

  // Remove visual indicators
  const style = document.getElementById("style-spy-cursor");
  if (style) {
    style.remove();
  }
  document.body.classList.remove("style-spy-active");

  // Remove the iframe container
  const container = document.getElementById("style-spy-container");
  if (container) {
    container.remove();
  }

  // Reset any highlighted element
  if (highlightedElement) {
    highlightedElement.style.outline = originalOutline;
    highlightedElement = null;
  }
}

function handleMouseMove(e) {
  if (!isInspectorEnabled || isPartOfUI(e.target)) return;

  // Remove previous highlight
  if (highlightedElement) {
    highlightedElement.style.outline = originalOutline;
  }

  // Highlight new element
  highlightedElement = e.target;
  originalOutline = highlightedElement.style.outline;
  highlightedElement.style.outline = "2px solid #007bff";
  highlightedElement.style.outlineOffset = "-2px";
}

function handleClick(e) {
  if (!isInspectorEnabled || !highlightedElement || isPartOfUI(e.target))
    return;

  console.log("Element clicked:", highlightedElement);

  e.preventDefault();
  e.stopPropagation();

  // Get computed styles
  const styles = window.getComputedStyle(highlightedElement);

  // Get element's CSS rules from stylesheets
  let matchingRules = [];
  for (let sheet of document.styleSheets) {
    try {
      let rules = sheet.cssRules || sheet.rules;
      for (let rule of rules) {
        if (highlightedElement.matches(rule.selectorText)) {
          matchingRules.push({
            selector: rule.selectorText,
            styles: rule.style.cssText,
          });
        }
      }
    } catch (e) {
      // Skip cross-origin stylesheets
      continue;
    }
  }

  // Send both computed and stylesheet styles
  chrome.runtime.sendMessage(
    {
      action: "showDetails",
      data: {
        html: highlightedElement.outerHTML,
        computedStyles: Array.from(styles).reduce((acc, prop) => {
          acc[prop] = styles.getPropertyValue(prop);
          return acc;
        }, {}),
        cssRules: matchingRules,
      },
    },
    (response) => {
      console.log("Details sent, response:", response);
    }
  );

  // Reset the element's outline but keep inspector enabled
  highlightedElement.style.outline = originalOutline;
  highlightedElement = null;
}
