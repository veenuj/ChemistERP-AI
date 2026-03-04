# 💊 QuickRx AI - Intelligent Pharmacy ERP

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

QuickRx AI is a next-generation Point of Sale (POS) and Inventory Management system tailored for modern pharmacies. It bridges the gap between traditional retail operations and cutting-edge artificial intelligence, featuring AI-driven prescription scanning, smart generic substitutions, and predictive stock alerts.

---

## ✨ Premium Features

* **🤖 AI Prescription OCR:** Instantly scan and parse handwritten or digital prescriptions using Google's Gemini AI, automatically adding recognized medicines to the cart.
* **🔄 Smart Generic Substitution:** Never lose a sale due to out-of-stock brands. The AI cross-references active pharmacological ingredients to suggest the closest generic matches from your current inventory.
* **🛒 High-Speed POS:** A fully keyboard-accessible, glassmorphism-styled checkout interface supporting partial searches, barcode scanning, and multi-payment tracking (CASH/UPI).
* **📊 Operational Dashboard:** Real-time analytics engine tracking daily revenue, top-moving medicines, and highlighting critical stock/expiry warnings with dynamic UI alerts.
* **🖨️ Audit-Ready Billing:** Automated, print-optimized tax invoices with instant duplication and historical ledger search functionality.

---

## 🛠️ Architecture & Tech Stack

### Frontend (Client)
* **Framework:** React 18 + Vite
* **Language:** TypeScript (Strict Mode)
* **Styling:** Tailwind CSS (Custom Glassmorphism UI)
* **Icons:** Lucide React

### Backend (Server)
* **Framework:** Java Spring Boot 3.x
* **Database Access:** Spring JDBC Template (Optimized for complex analytical queries)
* **AI Integration:** Spring AI / Gemini REST API

### Database
* **Engine:** PostgreSQL
* **Optimization:** B-Tree Indexed columns for lightning-fast historical ledger queries.

---

## 🚀 Getting Started

Follow these steps to set up the ERP locally on your machine.

### 1. Prerequisites
* Node.js (v18+)
* Java JDK 17+
* PostgreSQL (v14+)
* Google Gemini API Key

### 2. Database Setup
Create a local PostgreSQL database and run the initialization script:
```sql
CREATE DATABASE quickrx_db;
-- Connect to the DB and run the schema found in /erp/src/main/resources/schema.sql
```

### 3. Backend Setup (Spring Boot)
Navigate to the `erp` directory and configure your environment variables:
```bash
cd erp
```
Create a `.env` file in the root of the `erp` folder:
```bash
DB_URL=jdbc:postgresql://localhost:5432/quickrx_db
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
GEMINI_API_KEY=your_secret_api_key
```
Run the application:
```bash
./mvnw spring-boot:run
```

### 4. Frontend Setup (React)
Open a new terminal, navigate to the frontend directory:
```bash
cd quickrx-frontend
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

##🔒 Security

All sensitive environment variables `(.env)` are strictly ignored via `.gitignore`.

API keys are securely consumed server-side within the Spring Boot architecture to prevent client-side exposure.

##👨‍💻 Author

Anuj Dhiman Full Stack Developer | AI Solutions Architect Building scalable, intelligent enterprise applications.

Built with ❤️ for better healthcare management.
