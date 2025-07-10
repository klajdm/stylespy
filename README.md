# StyleSpy

StyleSpy is a Chrome extension that lets you inspect and analyze the CSS styles of any web element on any website. With a single click, you can highlight elements, view their computed and stylesheet CSS, and see their HTML in a beautifully styled popup—no DevTools required!

## Features
- **Toggle Inspector**: Enable or disable the CSS inspector by clicking the extension icon.
- **Element Highlighting**: Hover to highlight elements visually.
- **Style Extraction**: Click any element to extract its computed styles and matching CSS rules from stylesheets.
- **Popup Display**: View the selected element’s HTML and CSS in a draggable, DevTools-inspired popup.
- **Syntax Highlighting**: HTML and CSS are presented with syntax highlighting for easy reading.
- **Works Everywhere**: Requires minimal permissions and works on all web pages.

## Installation
1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the `StyleSpy` folder.
5. The StyleSpy icon will appear in your Chrome toolbar.

## Usage
1. Navigate to any website.
2. Click the StyleSpy extension icon to activate the inspector.
3. Hover over elements to highlight them.
4. Click an element to view its HTML and CSS in the popup.
5. Drag the popup to reposition it as needed.
6. Click the close button or the extension icon again to deactivate the inspector.

## Development
- **background.js**: Handles extension logic, toggling, and communication between scripts.
- **content.js**: Injected into pages; manages highlighting, style extraction, and user interaction.
- **popup.html/popup.js**: Renders the inspector UI and displays HTML/CSS details.
- **styles.css**: Additional CSS for highlighting elements.
- **manifest.json**: Extension configuration and permissions.

Feel free to fork, modify, and contribute!

## Author
Klajdi Murataj

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
