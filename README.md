
⚡ FlashMart – Flash Sales Management System

A web-based Flash Sales Management System built with HTML, CSS, JavaScript (frontend only) and integrated with MongoDB (Compass/Atlas) or Firebase for backend services.
The system ensures fair customer access during high-demand flash sales events using efficient DSA algorithms for queue management, recommendations, and analytics.


📌 Problem Statement

During flash sales, businesses face challenges like:
	•	❌ Unfair customer access (bots, high-speed users).
	•	📈 Server overload due to massive concurrent requests.
	•	🔎 Difficulty in providing real-time recommendations.
	•	⚖️ Lack of fairness in queue positioning.

✅ FlashMart solves these problems with a fair queue system and optimized DSA algorithms, while also supporting a business perspective with referrals, analytics, and smart recommendations.


🚀 Features
	•	🔐 User Authentication – Secure login & registration (Firebase/MongoDB).
	•	⏳ Flash Sale Queue Management – Fair queuing using FIFO + Priority Queue.
	•	🛒 Product Management – Add, update, and track inventory in real-time.
	•	📊 Analytics Dashboard – Sliding Window algorithm for user & sales insights.
	•	🤝 Referral Network Analysis – Graph algorithms for influence tracking.
	•	🎯 Smart Recommendations – Heap-based ranking (price, popularity, relevance).
	•	🔍 Search & Filtering – Real-time product discovery and relevance ranking.


🛠️ Tech Stack
	•	Frontend: HTML, CSS, JavaScript (pure, no frameworks).
	•	Database Options:
	•	MongoDB Atlas (cloud) or MongoDB Compass (local).
	•	Firebase Firestore / Realtime Database.
	•	Algorithms (DSA): Heap, Graph, Queue, Sliding Window, Search.


📂 Detailed Project Structure

flashmart/
│── 📄 README.md                      # Main documentation
│
├── 🔧 backend/                       # Backend configs & logic
│   ├── 📄 README.md                  # Backend-specific docs
│   ├── ⚙️ config/
│   │   └── 🔑 firebase-config.js     # Firebase credentials
│   └── 🚀 src/
│       └── 🔥 firebase-functions.js  # Cloud Functions logic
│
├── 🎨 frontend/                      # Frontend application
│   ├── 🖥️ Core HTML Pages
│   │   ├── 🏠 index.html             # Homepage
│   │   ├── 📊 business-dashboard.html
│   │   ├── 🛠️ operations-dashboard.html
│   │   ├── 📝 lead-capture.html
│   │   ├── 🧪 firebase-test.html
│   │   ├── 🧪 firebase-collections-test.html
│   │   ├── 🧪 test_admin_buttons.html
│   │   ├── 🧪 test_orders.html
│   │   └── 🎯 test_cart.js
│   │
│   ├── 🎯 JavaScript Files
│   │   ├── ⚡ main.js
│   │   ├── 🔢 counter.js
│   │   ├── 🛒 cart.js
│   │   ├── 🛒 cart-debug.js
│   │   ├── 🔧 debug_orders.js
│   │   └── 📦 direct_orders_fix.js
│   │
│   ├── 🎨 Styles
│   │   ├── 💅 style.css
│   │   ├── 🎭 styles/
│   │   │   ├── 🛍️ amazon-theme.css
│   │   │   └── 🎨 main.css
│   │   └── 💅 temp.css
│   │
│   ├── 🖼️ Assets
│   │   ├── 🎨 public/ (vite.svg)
│   │   └── 🖼️ javascript.svg
│   │
│   └── 🔬 scripts/
│       ├── 🧠 DSA Algorithms
│       │   ├── 🏗️ heap-utils.js
│       │   ├── 🌐 graph-algorithms.js
│       │   ├── ⏱️ sliding-window-manager.js
│       │   ├── 📋 queue.js
│       │   └── 🔍 search.js
│       │
│       ├── 🔧 Core Services
│       │   ├── 🔐 auth.js
│       │   ├── 📊 analytics.js
│       │   ├── 📦 data.js
│       │   ├── 🔥 firebase.js
│       │   ├── 💾 firestore-queries.js
│       │   ├── 🛒 inventory-manager.js
│       │   ├── 👥 lead-service.js
│       │   ├── ⚙️ operations-service.js
│       │   ├── 📦 products.js
│       │   └── 💰 transaction-service.js
│       │
│       ├── 📊 Dashboard Services
│       │   ├── 📈 activity-dashboard.js
│       │   ├── 👑 admin.js
│       │   ├── 📊 business-dashboard.js
│       │   ├── 📋 operations-dashboard.js
│       │   └── 📊 channel-analytics.js
│       │
│       └── 🧪 Testing Utilities
│           ├── 🧪 algorithm-integration-examples.js
│           ├── 🧪 firebase-test.js
│           ├── 🧪 cart-debug.js
│           ├── 🧪 order-tracker.js
│           └── 🧪 test_*.js
│
└── 📁 .git/                           # Git repository files


⚡ DSA Algorithms Used

1. Heap Data Structure (heap-utils.js)
	•	Type: Binary Heap (Min/Max + Priority Queue).
	•	Use Cases: Price & popularity recommendations, Top-K product selection, real-time ranking.
	•	Key Ops: bubbleUp(), sinkDown(), getTopK(), batchPush().

2. Graph Algorithms (graph-algorithms.js)
	•	Type: Directed Graph (BFS, DFS, cycle detection).
	•	Use Cases: Referral networks, social influence scoring, product relationships.
	•	Key Ops: BFS, DFS, cycle detection, centrality measures.

3. Sliding Window Algorithm (sliding-window-manager.js)
	•	Type: Time-based Windowing.
	•	Use Cases: Real-time activity tracking, trend analysis, performance monitoring.
	•	Features: Multiple time windows (5min, 1hr, 24hrs), memory-efficient cleanup.

4. Queue Data Structure (queue.js)
	•	Type: FIFO + Priority Queue.
	•	Use Cases: Fair flash sale queue, real-time updates, premium user prioritization.
	•	Features: Queue persistence & recovery, position updates.

5. Search & Filtering (search.js)
	•	Type: String Matching & Filtering.
	•	Use Cases: Real-time search, multi-criteria filtering, relevance ranking.


📈 Business Use Case

FlashMart ensures:
	•	⚖️ Fairness: Queue prevents bots and unfair access.
	•	🌍 Scalability: MongoDB/Firebase handle concurrent users.
	•	🤝 Customer Engagement: Referral programs boost growth.
	•	💰 Revenue Growth: Premium queue access monetizes sales.
	•	📊 Insights: Real-time analytics optimize inventory & marketing.
  

📦 Setup Instructions

Option 1: Firebase
	1.	Create a Firebase project.
	2.	Enable Authentication + Firestore/Realtime Database.
	3.	Add credentials to firebase-config.js.

Option 2: MongoDB Atlas/Compass
	1.	Create a cluster in MongoDB Atlas.
	•	For offline testing → use MongoDB Compass.
	2.	Add connection string to mongo-config.js.

Run Project
	•	Open index.html in a browser.
	•	Ensure DB configuration is properly connected.


🎯 Future Enhancements
	•	🤖 AI-driven recommendation engine.
	•	🔗 Blockchain-based flash sale transparency.
	•	📱 Mobile-first PWA version.
	•	💹 Dynamic pricing algorithms.


👨‍💻 Author

Aayush Kamble – College Project on Flash Sales Management System
Built With: HTML, CSS, JS, MongoDB/Firebase, DSA Algorithms
