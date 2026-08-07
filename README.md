# Aegis – Sustainable Living Dashboard

> Built for the Pixxel 2.0 Hackathon

Aegis is an interactive, gamified web dashboard designed to encourage environmentally friendly habits within urban populations. Users log daily activities to generate a personalized carbon footprint score, explore local recycling centers, and complete eco-challenges to earn real-world rewards.

## Features

* **Dynamic Carbon Footprint Estimator:** Calculates a real-time sustainability score based on commute, diet, and lifestyle inputs.
* **Mission Board Gamification:** Users complete daily and weekly quests (e.g., "Meatless Monday", "Public Transit") to unlock animated badges and community coupon codes.
* **Interactive Data Visualization:** Integrates `Chart.js` to show weekly emission trends based on the user's specific profile.
* **Auto-Geolocation & Local Storage:** Uses the browser Geolocation API to instantly detect the user's city for mapping, and LocalStorage to securely maintain session state without a database.
* **Responsive Light/Dark Mode:** Full theme toggling for accessibility and modern UI standards.

## Tech Stack

* **Frontend:** HTML5, CSS3 (Custom Variables), Vanilla JavaScript.
* **Libraries:** Chart.js, Canvas-Confetti.
* **APIs:** OpenStreetMap Nominatim API (Reverse Geocoding).

## Getting Started

1. Clone the repository: `git clone https://github.com/yourusername/aegis.git`
2. Open the directory on your local machine.
3. Simply launch `index.html` in any modern web browser to view the application. No build steps or package installations are required.

## Future Implementation 

While the current build utilizes JavaScript for client-side calculations and LocalStorage for state management, future iterations are planned to implement a dedicated backend architecture (e.g., a Java Spring Boot REST API) to handle secure user authentication, persistent database storage, and integrations with live Air Quality APIs.
