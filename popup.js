// Listen for messages from the parent window
window.addEventListener("message", (event) => {
  if (event.data.type === "UPDATE_DETAILS") {
    updateDisplay(event.data.data);
  }
});

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  // Get the data from background script
  chrome.runtime.sendMessage({ action: "getDetails" }, (response) => {
    if (response && response.data) {
      updateDisplay(response.data);
    }
  });
});

function updateDisplay(data) {
  if (!data) return;

  // Format HTML with Chrome DevTools-style syntax highlighting
  const formatHTML = (html) => {
    let formatted = "";
    let indent = 0;

    // Helper function to escape HTML
    const escape = (str) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    // Add Chrome DevTools-style syntax highlighting
    const colorize = (text) => {
      return (
        text
          // Tag structure
          .replace(
            /(&lt;\/?)([\w-]+)([^&]*?)(&gt;)/g,
            '<span class="angle">&lt;</span>' +
              "$2" +
              '<span class="attribute">$3</span>' +
              '<span class="angle">&gt;</span>'
          )
          // Attributes
          .replace(
            /\s([\w-]+)(=)(&quot;[^&quot;]*&quot;)/g,
            ' <span class="attr-name">$1</span>' +
              '<span class="attr-equals">$2</span>' +
              '<span class="attr-value">$3</span>'
          )
      );
    };

    html = html.replace(/>\s+</g, "><");

    html.split(/<(?=[/!]?[a-zA-Z])/g).forEach((chunk) => {
      if (!chunk) return;
      if (chunk.startsWith("/")) indent--;
      formatted += "  ".repeat(indent) + "<" + chunk;
      if (
        !chunk.startsWith("/") &&
        !chunk.endsWith("/>") &&
        !chunk.startsWith("!")
      ) {
        indent++;
      }
      formatted += "\n";
    });

    return colorize(escape(formatted));
  };

  // Format CSS with Chrome DevTools-style syntax highlighting
  const formatCSS = (data) => {
    let formatted = "";

    const colorizeCSS = (text) => {
      return (
        text
          // Comments
          .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>')
          // Selectors
          .replace(
            /([^{}\n]+)({)/g,
            '<span class="selector">$1</span><span class="bracket">$2</span>'
          )
          // Properties
          .replace(
            /([\w-]+):/g,
            '<span class="property">$1</span><span class="colon">:</span>'
          )
          // Values
          .replace(/:\s*([^;}\n]+)/g, ' <span class="value">$1</span>')
          // Closing brackets
          .replace(/}/g, '<span class="bracket">}</span>')
      );
    };

    // Element styles from stylesheets
    if (data.cssRules && data.cssRules.length > 0) {
      formatted += "/* Element styles */\n";
      data.cssRules.forEach((rule) => {
        formatted += `${rule.selector} {\n`;
        const styles = rule.styles.split(";").filter((s) => s.trim());
        styles.forEach((style) => {
          formatted += `  ${style.trim()};\n`;
        });
        formatted += "}\n\n";
      });
    }

    // Computed styles
    const computedStyles = data.computedStyles;
    const styleGroups = {
      Layout: [
        "display",
        "position",
        "top",
        "right",
        "bottom",
        "left",
        "float",
        "clear",
      ],
      Box: ["width", "height", "padding", "margin", "border"],
      Typography: ["font", "text", "line-height", "color"],
      Background: ["background"],
      Flexbox: ["flex", "align", "justify"],
      Transform: ["transform"],
      Animation: ["animation", "transition"],
    };

    for (const [group, properties] of Object.entries(styleGroups)) {
      let hasGroupStyles = false;
      let groupStyles = `\n/* ${group} */\n`;

      for (const prop in computedStyles) {
        if (properties.some((p) => prop.startsWith(p))) {
          const value = computedStyles[prop];
          if (
            value &&
            value !== "0px" &&
            value !== "none" &&
            value !== "normal" &&
            value !== "auto"
          ) {
            groupStyles += `  ${prop}: ${value};\n`;
            hasGroupStyles = true;
          }
        }
      }

      if (hasGroupStyles) {
        formatted += groupStyles;
      }
    }

    return colorizeCSS(formatted);
  };

  document.getElementById("html-content").innerHTML = formatHTML(data.html);
  document.getElementById("css-content").innerHTML = formatCSS(data);
}
