# 🌍 Aegis - Sustainable Enviro | Mission Swachh-City

**Aegis - Sustainable Enviro** is a gamified, interactive web application designed to encourage citizens to track their carbon footprint, adopt sustainable daily habits, and actively contribute to a cleaner, greener city. Built in alignment with the principles of **Mission LiFE** (Lifestyle for Environment) and the **Swachh Bharat Mission**, this platform turns environmental responsibility into an engaging community effort.

---

## ✨ Key Features

*   **🌗 Dynamic Theme Support:** Fully responsive Light and Dark modes with a clean, modern aesthetic. 
*   **📊 Interactive Carbon Score Engine:** Calculates a personalized "Bharat Carbon Score" during onboarding based on commute, diet, energy, and waste habits. Users can log daily activities (max twice a day) to see their real-time impact.
*   **🗺️ Local Recycling Map:** Integrated with Leaflet.js to help users find nearby Kabadiwalas, E-waste kiosks, and battery drop-off points within a 5km radius.
*   **🏭 Live AQI Simulator:** A visual Air Quality Index tower and skyline that visually improves as the user completes eco-friendly tasks and lowers their carbon footprint.
*   **🎯 Mission Board & Swachh Directives:** Gamified daily, weekly, monthly, and yearly eco-tasks. Completing tasks earns "Green Points" which unlock badges, rank upgrades, and real-world reward coupons.
*   **🧠 Daily Gyan Feed:** A daily dose of eco-knowledge, sustainable life hacks, "Thought of the Day," and Green News updates.
*   **🤝 Citizens Network (Community):** A social feed where users can share their eco-achievements, like, and interact with the community.
*   **🎮 Game Zone:** Two built-in interactive mini-games ("Quick Segregation" and "Catch the Recyclables") that educate users on waste segregation while rewarding them with Green Points.
*   **🧑‍🚀 Advanced Citizen Profiles:** A comprehensive profile system featuring customizable avatars, rank progression (from *Seed of Change* to *Aegis Master*), and an unlockable badge locker.

---

## 🛠️ Tech Stack

This project is built using a lightweight, entirely frontend stack, making it blazing fast and easy to deploy:

*   **HTML5:** Semantic structuring and layout.
*   **CSS3:** Custom styling, CSS Variables for seamless light/dark theme switching, and smooth keyframe animations (no external CSS frameworks used).
*   **Vanilla JavaScript (ES6+):** Handles all logic, state management, gamification algorithms, and dynamic DOM manipulation.
*   **Leaflet.js:** Open-source JavaScript library for mobile-friendly interactive maps.
*   **Local Storage (AegisDB):** A custom mock-database wrapper utilizing browser `localStorage` to persist user profiles, scores, points, and history without needing a backend server.

---

## 🚀 How to Run the Project

Since this application is a pure frontend build with a local storage database, no complex server setup is required.

1.  **Clone or Download** the repository to your local machine.
2.  Navigate to the project folder.
3.  Double-click the `index.html` file to open it in your default web browser.
    *   *Note: An active internet connection is required to load the Google Fonts, Leaflet.js map tiles, and Nominatim geocoding API.*

---

## 📱 App Structure & Navigation

1.  **Home / Landing:** Features an interactive split-screen slider demonstrating the visual difference between a polluted city and a restored, green city.
2.  **Carbon Score (Dashboard):** The command center for logging daily habits (AC usage, commute, meals) and viewing history trends.
3.  **Recycling Map:** Auto-centers on the user's city to display interactive recycling drop-off points.
4.  **AQI Engine:** Displays simulated real-time air quality metrics and health recommendations based on user scores.
5.  **Daily Gyan:** Educational feed for daily sustainability tips.
6.  **Mission Board:** Gamified task tracker for claiming rewards and leveling up.
7.  **Swachh Directives:** Informational hub regarding official Indian government environmental mandates.
8.  **Community Posts:** A mock social feed for citizen interaction.
9.  **Game Zone:** Learn waste segregation through gameplay.
10. **Profile:** Edit details, change avatars, and view unlocked badges and ranks.

---

## 🔐 Authentication System (Demo Mode)

The app features a fully functional mock authentication flow:
*   **OTP Login:** Enter any 10-digit phone number. The system will generate a mock 4-digit OTP displayed on the screen. Enter this OTP to log in and save your progress.
*   **Guest Mode:** Allows users to test the application and complete onboarding without saving any data to the local storage.

---

## 🔮 Future Roadmap

If this project were to be scaled to production, the following features would be added:
*   **Backend Integration:** Connect to a Node.js/Python backend with MongoDB/PostgreSQL for secure user data persistence.
*   **Real AQI API:** Integrate with live APIs (like IQAir or OpenWeatherMap) to fetch real-time city data.
*   **Map API Upgrade:** Transition from mock static markers to a live Google Maps Places API for dynamic recycling center discovery.
*   **Live Leaderboards:** Introduce a global community leaderboard based on Green Points.
*   **Push Notifications:** Daily reminders to log parameters and complete directives.

---

## 📜 License

This is a concept application built for Hackathons and Environmental awareness demonstrations. 

*Designed and developed for Mission Swachh-City.*
