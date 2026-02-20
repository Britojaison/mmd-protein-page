# World Protein Day - Milky Mist

A Next.js application for calculating daily protein requirements and generating personalized meal plans using Milky Mist products.

## Features

- Personal details form (name, age, height, weight)
- Protein requirement calculation (weight × 1.2)
- 7-day meal plan with Milky Mist products
- Local JSON storage for user data
- User count tracking
- External API integration (placeholder)
- Clean Tailwind UI

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open [http://localhost:3000/world-protein-day](http://localhost:3000/world-protein-day)

## Project Structure

```
src/
├── app/
│   ├── world-protein-day/
│   │   ├── page.js
│   │   ├── ProteinForm.js
│   │   └── MealPlan.js
│   ├── api/
│   │   ├── save-user/route.js
│   │   └── user-count/route.js
├── data/
│   ├── users.json
│   └── products.json
└── utils/
    └── protein.js
```

## API Routes

- `POST /api/save-user` - Save user data to users.json
- `GET /api/user-count` - Get total number of users

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_PROTEIN_API=https://api.example.com/protein-data
```
