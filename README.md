# 🛡️ Aegis – Sustainable Living Dashboard

> **Empowering citizens to restore their cities, one habit at a time.**
> Built for the **Pixxel 2.0 Hackathon** | Bonus Theme: Most Creative 

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

---

## 📖 Table of Contents
1. [About the Project](#about-the-project)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Usage & Demo Flow](#usage--demo-flow)
6. [System Architecture](#system-architecture)
7. [Roadmap](#roadmap)

---

## 🌍 About the Project

**Aegis** is an interactive, gamified web dashboard designed to encourage environmentally friendly habits through real-time feedback and community rewards. 

Urban carbon footprints are largely driven by daily micro-decisions: how we commute, what we eat, and how we handle waste. Aegis tackles this by gamifying sustainability. Users log their daily activities to generate a personalized carbon footprint score, explore local recycling centers via an interactive map, and complete eco-challenges to earn real-world rewards like transit passes or discount codes.

---

## ✨ Key Features

*   **Dynamic Carbon Footprint Estimator:** Calculates a real-time sustainability score out of 100 based on onboarding inputs (commute type, diet, recycling habits, etc.).
*   **Mission Board & Gamification:** Users can accept and track Daily, Weekly, and Monthly quests (e.g., "Meatless Monday", "Public Transit Legend"). Completing missions triggers dopamine-driven confetti animations and unlocks reward codes.
*   **Data Visualization:** Integrates `Chart.js` to render a dynamic weekly emission trend graph, visually representing the user's estimated CO2 output.
*   **Auto-Geolocation Mapping:** Utilizes the native browser Geolocation API and reverse-geocoding to instantly detect the user's city and update the Recycling Map interface.
*   **State Management (No-DB):** Employs `LocalStorage` to securely maintain user session state, profile data, and carbon scores across page reloads without requiring a live backend for the demo.
*   **Accessible UI/UX:** Features a seamless, responsive layout with a built-in **Light/Dark Mode** toggle to suit user preferences and reduce screen energy consumption.

---

## 🛠️ Tech Stack

### Frontend Architecture
*   **Structure:** HTML5
*   **Styling:** CSS3 (Custom Properties/Variables, Flexbox, CSS Grid)
*   **Logic & DOM Manipulation:** Vanilla JavaScript (ES6+)

### Libraries & APIs
*   **[Chart.js](https://www.chartjs.org/):** For rendering interactive, responsive data visualisations.
*   **[Canvas Confetti](https://www.kirilv.com/canvas-confetti/):** For micro-interaction gamification and reward feedback.
*   **[Nominatim API (OpenStreetMap)](https://nominatim.org/):** Free reverse-geocoding to convert browser coordinates into readable city names.

---

## 🚀 Getting Started

Because Aegis is currently built as a standalone frontend application utilizing local storage, running the project locally is incredibly simple. No package managers or build tools are required.

### Prerequisites
*   A modern web browser (Chrome, Firefox, Edge, Safari).
*   An active internet connection (required to load external CDNs for Chart.js and Confetti).

### Installation
1. Clone the repository to your local machine:
   ```bash
   git clone [https://github.com/yourusername/aegis.git](https://github.com/yourusername/aegis.git)
