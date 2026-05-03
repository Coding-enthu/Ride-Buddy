# Ride Buddy — Smart Hazard-Aware Navigation System

## Project Description
Ride Buddy is a **next-generation navigation platform** that goes beyond traditional map-based routing by integrating **real-time road condition intelligence** into route planning.

### Overview
The system provides users with optimized navigation routes not only based on distance or time, but also on **road safety and quality**. It achieves this by combining map data with **crowdsourced hazard reports** such as:

- Potholes  
- Bad roads  
- Illegal speed breakers  

### Core Idea
Instead of asking **“What is the fastest route?”**, the system answers:  
**“What is the safest and most comfortable route?”**

---

## How It Works

![Image](https://images.openai.com/static-rsc-4/ye87UdcMXJo5HaKW6SPmqr7F2HcI30p_K5--4Ig--zv52z5RTMwCaUp7wZ9GMH8-FO8X74LlanqtN6is2oIwmvNp9UezbS0NXm1xp-5wHCQNCoEkefMESBQLIFIV2WooO-OjPm42suFP_CERpU2eBXRJ83xEPUpRghufRAgD9i1FkI6fFtIRjADg4gAk1jPj?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/4e6HrS3KiWyuSwxg5vsTYtlzzKrqdmTsc1bKfrcMvlYUJ0FXTraNX04myrCUEvp3s3MNc5bnT9duxncknFebHB_IWRQG8elufrwkZAaP9RLiXYBESUpXmBGHshCsA1PoLKNM7i19Rz_nt0aooGMmaUxFGpwf1m8-pEdzSbzv-0-4D7WI2VhPlXhCY67F2F48?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/l0MgQ4mRGiqP8j6vEoJBBp9C3qSy2PIt9OjHcw-fnwe6Q_QLIJSCwhQGojwpO1-ALpqvH5F1sc_NR7GXwAMF7ZEhWZYxU7lqPRLzbPsFlocKTnbdKHjz780w-XG3g558qMujUNnFl2Rp7lWGh4coaRISHH8yVfXt0n2DKuxWbamkzwj7uxzOvMI9q2F8if4q?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/oWyVfuGYhWtZAmNJpsk_Kq2C1ArHsIyJDyaQXy3BNuZRKz2yWrteSduo_AA9SYrvg1R4VC12NAjmoso8WK8MO9Ac6-Qlk4f9LarXtDgn5xM1P5gce50mQ7ptshSkhawi2_1knZffQy1zjt-jn8V6uumVj1-_8o1foqEP-nRMvyV0KlCLcoJVb3q8Vu1fXarZ?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/vXCIgHtSUSW2NI2jg5khr-rFTsGA9Z2azJEpHL9ORL6w0wijfkHjniNGF9voq5beHr2fjXXoP89-G5VCMlYIYTYDj4K9qWuGPxRR_HPDd9q6f2Vo-xKDdeiFiddIueYMSjsB2GCCE3Twg3DArgX_97XhDTSe1M0iC-A5VtpcWWsau3S9lk4_Aj4CKmOITBhl?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/76gHn9mTpLo42Oby1Yki6XeO_aYTHQYDrAyvji5rhKKLWXZAefSlN-xCYbuDh6jWXYIC4LAVVkElO6RkBfBSYpo4mRmT5KQ8dCA1vRIDc4mlGz2StRN4QZULV646nkdq0r8MEHnPhyLZHxnukEsBNq7JYz1BnnaBDk8gHSpIHyALkYAP91B4S7IBczC1pFqY?purpose=fullsize)

### 1) Route Generation
- Uses external routing engines like **Open Source Routing Machine (OSRM)** to generate multiple possible routes between two locations.

### 2) Hazard Collection
- Users report hazards through the app (camera-based input).
- Each report includes:
  - Location (lat, lng)
  - Hazard type
  - Severity

### 3) Data Validation
- Duplicate reports are prevented using **geospatial proximity checks**.
- Nearby reports are merged or rejected to maintain data quality.

### 4) Smart Route Scoring
Each route is evaluated using a scoring model:
- Base factor: travel time
- Penalty factor: hazards along the route

Routes with more hazards are penalized, and the system selects the **optimal balance between speed and safety**.

### 5) Explainable Output
The system doesn’t just return a route—it explains the decision:
- Number of hazards avoided
- Type of hazards
- Safety score

---

## Key Features
- **Hazard-Aware Routing:** Routes adapt dynamically based on real-world road conditions.
- **Duplicate Detection:** Prevents spam and ensures high-quality data using distance-based filtering.
- **Scalable Design:** Uses bounding-box queries and optimized geo-calculations for performance.
- **Explainable Logic:** Provides reasoning behind route selection for trust and usability.

---

## Backend Architecture
Built using:
- **Express.js** → API layer  
- **PostgreSQL** → hazard storage  
- **(Optional) Neon** → cloud hosting  

### Key APIs
- `POST /hazards` → report hazard  
- `GET /hazards/check` → detect duplicates  
- `GET /route` → get optimized route  

---

## Use Cases
- Daily commuters avoiding poor roads
- Delivery and logistics optimization
- Smart city infrastructure insights
- Ride-sharing safety improvements

---

## Future Scope
- AI-based pothole detection using camera
- Real-time updates via WebSockets
- Heatmaps of road conditions
- Government integration for road maintenance

---

## One-line pitch
> “A navigation system that doesn’t just get you there faster—it gets you there smarter and safer.”

---

## Tech Stack
Based on this repository’s codebase:
- **TypeScript**, **JavaScript**, **CSS**, **HTML**

> If your repo includes the backend (Express/Postgres) in a separate folder or service, add it here and I’ll tailor this section to match the exact structure.

---

## Getting Started
> Update these steps to match your actual setup (frontend-only vs fullstack). If you share your run commands (`package.json` scripts) I can make this exact.

1. Clone:
   ```bash
   git clone https://github.com/Coding-enthu/Ride-Buddy.git
   cd Ride-Buddy
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start:
   ```bash
   npm start
   ```

---

## Contributing
Contributions are welcome—please open an issue or submit a pull request.

## License
Add your license here (e.g., MIT). If you already have a `LICENSE` file, this section can link to it.
