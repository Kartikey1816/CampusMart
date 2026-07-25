# CampusMart

CampusMart is a campus-only marketplace where verified college students can buy and sell items safely within their community. It brings together discovery, listing management, wishlists, and listing-specific buyer–seller chat in one responsive web application.

## Why CampusMart?

Buying and selling through informal college groups is often noisy, hard to search, and offers little confidence about who is on the other side. CampusMart addresses that with college-email verification, structured listings, seller-aware access controls, and a focused local-pickup workflow.

## Features

- **College-only accounts** — signup is restricted to configured college email domains; users verify their email before logging in.
- **Secure authentication** — passwords are hashed with bcrypt and protected API routes use JWT bearer tokens.
- **Marketplace discovery** — browse listings, search by keyword, and filter by category, condition, and price.
- **Listing management** — verified users can create, edit, mark sold, upload up to five images to, and delete their own listings.
- **Seller profiles** — users can update profile details while public seller views deliberately exclude email addresses.
- **Buyer–seller chat** — one conversation per buyer and listing keeps messages relevant and private to the participants.
- **Wishlist** — save available listings for later; saved items retain their sold status so buyers can make informed decisions.
- **Development-friendly setup** — the backend creates a verified development test user and sample fixtures outside production.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Tailwind CSS, Lucide icons |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB |
| Authentication | JSON Web Tokens, bcrypt |
| File uploads | Multer (local development storage) |
| Email | Nodemailer |

## Project Structure

```text
CampusMart/
├── frontend/                # React + Vite client
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── services/
└── backend/                 # Express + MongoDB API
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── utils/
    └── uploads/             # Created locally for listing images
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- MongoDB database (local instance or MongoDB Atlas)
- An SMTP account for real email delivery (optional in development)

### 1. Clone and install dependencies

```bash
git clone https://github.com/Kartikey1816/CampusMart.git
cd CampusMart

cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure the backend

Copy the example environment file and update the values:

```bash
cd backend
cp .env.example .env
```

At minimum, configure these values in `backend/.env`:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_secret
ALLOWED_COLLEGE_EMAIL_DOMAINS=yourcollege.edu
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

For real verification emails, also provide the `SMTP_*` and `EMAIL_FROM` values from `.env.example`. Without SMTP in development, verification responses include a local development verification URL; production never exposes verification tokens.

### 3. Start the application

Run these in two terminals:

```bash
# Terminal 1 — API at http://localhost:5001
cd backend
npm run dev
```

```bash
# Terminal 2 — client (usually http://localhost:5173)
cd frontend
npm run dev
```

The frontend connects to `http://localhost:5001/api/v1` by default. To use another API address, create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```

### Development account

When `NODE_ENV` is not `production`, the server seeds a verified development user:

```text
Username: admin
Password: 12345678
```

Override it with `DEV_TEST_EMAIL` and `DEV_TEST_PASSWORD` in `backend/.env`. Never use these credentials in production.

## API Overview

All protected endpoints require:

```http
Authorization: Bearer <token>
```

| Area | Endpoints |
| --- | --- |
| Health | `GET /api/v1/health` |
| Auth | `/api/v1/auth/*` — signup, verification, login, and current user |
| Profiles | `/api/v1/profile/*` — current user profile and seller profile |
| Listings | `/api/v1/listings/*` — browse, manage listings, images, and sold status |
| Conversations | `/api/v1/conversations/*` — start conversations and exchange messages |
| Wishlist | `/api/v1/wishlist/*` — save and remove listings |

`GET /api/v1/listings` supports `q`, `category`, `condition`, `minPrice`, `maxPrice`, `sort`, `status`, `seller`, `page`, and `limit`. The available sort values are `newest`, `oldest`, `price_asc`, and `price_desc`.

For detailed request bodies and behaviour, see the [backend API documentation](backend/README.md).

## Security and Access Rules

- Only configured college email domains can register.
- Accounts must verify their email before they can log in.
- Users may modify or remove only their own listings.
- Seller email addresses are never returned by public profile or listing responses.
- Conversations are listing-scoped and visible only to their buyer and seller.
- Users cannot start a conversation about their own or a sold listing, and cannot wishlist their own listings.

## Production Notes

- Replace local `uploads/` storage with an object store such as Cloudinary or Amazon S3 before deploying to an environment with ephemeral storage.
- Set a strong, unique `JWT_SECRET`, configure real SMTP credentials, and keep `.env` files out of source control.
- Use a hosted MongoDB instance and set `CLIENT_URL` to the deployed frontend URL.

## Future Improvements

- Ratings and reviews after completed exchanges
- Push or email notifications for new messages
- Moderation tools and reporting workflows
- Image optimization and cloud-backed media storage
- Payments and delivery integrations, if appropriate for the campus

## License

This project is currently not licensed for reuse. Add a license file before distributing or accepting external contributions.
