# kisan-connect
# Smart Farmer AI - Agriculture Marketplace Prototype

## 1. Project Overview
**Smart Farmer AI** is a digital platform designed to bridge the gap between farmers and buyers. Agriculture is the backbone of India, and our prototype aims to provide a direct, transparent connection to improve farmer visibility and buyer trust.

## 2. Problem Statement
* **Farmer Visibility:** Small-scale farmers struggle to showcase their available crops to nearby buyers.
* **Buyer Trust:** Buyers need verified information like crop photos, location, and contact details before purchasing.
* **Middlemen Issues:** Direct communication reduces delays and ensures fair pricing for both parties.
* **The "Stuck Data" Bug:** Traditional frontend-only apps keep data localized. Our solution uses a shared backend so all users see the same real-time data.

## 3. Key Features
* **Dual Roles:** Separate specialized interfaces for **Farmers** and **Buyers**.
* **Secure Authentication:** Registration, login, and password reset functionality.
* **Crop Management:**
    * **Farmers:** Can upload crop names, quantity, price per unit, photos, and Google Maps location.
    * **Owner Control:** Only the farmer who uploaded a specific crop can delete it.
* **Buyer Actions:**
    * Search and discover local crop listings.
    * Direct contact via **Phone Call** or **WhatsApp**.
    * **Location Viewing:** Integration with Google Maps for easy navigation.
* **Payment & Support:**
    * **UPI Integration:** Direct link for payments and receipt downloads.
    * **AI Guide:** Step-by-step assistance in **English** and **Kannada**.
    * **Feedback System:** Buyers can rate farmers to build marketplace trust.

## 4. Technical Architecture
* **Frontend:** Responsive web application built with HTML, CSS, and JavaScript.
* **Backend:** Node.js APIs handling authentication, payments, and data management.
* **Database:** Shared cloud database for real-time synchronization across devices.
* **AI Integration:** Gemini API for intelligent guidance (secured on the backend).

## 5. User Workflow
1.  **Farmer Registration:** Farmer signs up and completes their profile.
2.  **Listing:** Farmer uploads crop details (e.g., Tomato, 500kg, ₹25/kg) and location.
3.  **Discovery:** Buyer logs in from a different device and searches for crops.
4.  **Action:** Buyer views the listing and contacts the farmer via WhatsApp or Call.
5.  **Transaction:** Buyer pays via UPI and downloads the generated receipt.
6.  **Support:** Users can use the AI Assistant for guidance in their preferred language.

## 6. Implementation & Guidance
### Setup Instructions
* Ensure the latest version of Node.js is installed.
* Configure the `.env` file with the Gemini API key (keep this secret and never upload it to the frontend).
* Initialize the backend server to enable shared data across devices.

### Support
The built-in AI Guide provides step-by-step help for first-time users, ensuring a smooth experience for both farmers and buyers in rural and urban areas.

---
**Team: 1st Year ECE Branch, CIT College**
* Kowshik MS
* Haseebuddin
* Adithya
* Muneeb
