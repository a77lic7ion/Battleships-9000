
# Battleships 9000

**Battleships 9000** is a high-fidelity, futuristic naval combat simulator built with modern web technologies. It features a tactical terminal interface, advanced AI with multi-stage hunting logic, and integration with the Google Gemini API for real-time tactical commentary.

## 🚀 Features

- **Futuristic Terminal UI**: A high-contrast, blue-themed aesthetic with CRT scanlines, motion blur transitions, and responsive design.
- **Advanced Tactical AI**: 
  - **Single Player Mode**: Face off against a recursive AI core with three difficulty levels (Easy, Medium, Hard).
  - **Hunting Logic**: The AI aggressively identifies and neutralizes partially hit ships using neighbor-search and orientation-detection algorithms.
- **Local Multiplayer**: Engage in secret tactical maneuvers with a friend on the same device, featuring secure handover transitions to keep your fleet positions private.
- **Drag-and-Drop Deployment**: Smoothly drag vessels from your armory onto the tactical grid or reposition existing ships with intuitive pointer controls.
- **Gemini AI Integration**: Receive real-time, context-aware tactical insights and taunts from an advanced neural-net command core (requires Gemini API Key).
- **Immersive Soundscapes**: Dynamic UI sounds and combat effects built using the Web Audio API.

## 🛠️ Tech Stack

- **Framework**: [React 19](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Core**: [Google Gemini API (@google/genai)](https://ai.google.dev/)
- **Audio**: Web Audio API
- **Icons**: [Material Symbols Outlined](https://fonts.google.com/icons)

## 📦 Installation & Setup

Since this is a web-based application, you can run it directly in any modern browser.

### Prerequisites
- A modern web browser (Chrome, Edge, or Safari recommended).
- (Optional) A Google Gemini API Key for tactical commentary features.

### Local Execution
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/battleships-9000.git
   ```
2. Navigate to the project root and serve the files using any local web server (e.g., Live Server for VS Code).
3. Open `index.html` in your browser.

### Configuring AI Insights
To enable the **Gemini Tactical Feedback** feature:
- Ensure the `process.env.API_KEY` is configured in your environment or provided via the platform's key injection mechanism.
- Navigate to the **Settings** screen in-game to toggle the "Cognitive AI Protocols".

## 🎮 How to Play

1. **Initialize**: Choose Single Player or Local Multiplayer from the Main Menu.
2. **Deploy**: Drag your fleet (Carrier, Battleship, Destroyer, Submarine, Patrol Boat) onto the coordinate grid. Use the **Flip Axis** button or just click to rotate.
3. **Engage**: Take turns striking coordinates on the enemy's grid. Red crosses indicate a hit; white markers indicate a miss.
4. **Win**: Sink all five enemy vessels to secure naval supremacy.

---

*Developed by the BS9K-XT Tactical Command Team.*
