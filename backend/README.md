# Authentication API — Milestone 2

Add the values from `.env.example` to `backend/.env`. Set `ALLOWED_COLLEGE_EMAIL_DOMAINS` to the real college domain (or comma-separated domains), and use a long random `JWT_SECRET`.

In development, if SMTP is not configured, signup and resend responses include a `developmentVerificationUrl` for testing. Production requires SMTP settings and never exposes the token in an API response.

### Development test login

When `NODE_ENV` is not `production`, starting the backend creates or refreshes a verified test account. Use **username `admin`** and **password `12345678`** in the login screen; no email-verification step is needed. You can override the account email or password with `DEV_TEST_EMAIL` and `DEV_TEST_PASSWORD` in `backend/.env`. This account is never created in production.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/signup` | Creates an unverified account and sends a verification link. Body: `name`, `email`, `password` |
| POST | `/api/v1/auth/verify-email` | Verifies the token. Body: `token` |
| POST | `/api/v1/auth/resend-verification` | Sends a fresh link. Body: `email` |
| POST | `/api/v1/auth/login` | Returns a JWT after verified email and password checks. Body: `email`, `password` |
| GET | `/api/v1/auth/me` | Protected current-user route. Header: `Authorization: Bearer <token>` |

Passwords are bcrypt-hashed before storage; verification tokens are stored as SHA-256 hashes and expire after one hour.

## User Profile — Milestone 3, Task 1

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/profile/me` | Returns the signed-in user's profile. |
| PATCH | `/api/v1/profile/me` | Updates the signed-in user's profile fields. |
| GET | `/api/v1/profile/:userId` | Returns a seller-safe profile with no email address. |

All profile endpoints require `Authorization: Bearer <token>`. Email remains managed by the verified-account flow, so it cannot be changed through the profile endpoint.

`PATCH /api/v1/profile/me` accepts one or more of:

```json
{
  "name": "Aarav Sharma",
  "avatarUrl": "https://images.example.com/avatars/aarav.jpg",
  "hostel": "Tagore Hostel",
  "department": "Computer Science and Engineering",
  "year": 2
}
```

Set an optional text field to `null` or an empty string to clear it. Avatar URLs must use `http` or `https`; file uploads and Cloudinary storage can be added when the frontend image-upload flow is built. Ratings are read-only: `average` and `count` start at `0` and will be updated by the future review system.

## Listings and Discovery — Milestones 4–5

Every signed-in, verified college user can create and manage their own listings. A listing has a title, description, price, category, condition (`new`, `like-new`, `good`, or `fair`), pickup location, up to five images, and an `available`/`sold` status. Only its seller can edit it, upload images, mark it sold, or delete it.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/listings` | Browse, search, filter, and sort listings. |
| POST | `/api/v1/listings` | Create a listing. Protected. |
| GET | `/api/v1/listings/:listingId` | View one listing and seller-safe profile details. |
| PATCH | `/api/v1/listings/:listingId` | Edit a listing. Protected seller-only. |
| POST | `/api/v1/listings/:listingId/images` | Upload one to five images. Protected seller-only. |
| PATCH | `/api/v1/listings/:listingId/mark-sold` | Mark a listing as sold. Protected seller-only. |
| DELETE | `/api/v1/listings/:listingId` | Delete a listing and its locally stored images. Protected seller-only. |

Create a listing with JSON and the `Authorization: Bearer <token>` header:

```json
{
  "title": "Scientific Calculator",
  "description": "Casio calculator in excellent working condition, used for one semester.",
  "price": 650,
  "category": "Electronics",
  "condition": "good",
  "pickupLocation": "Library entrance"
}
```

To upload images, send `multipart/form-data` to `POST /api/v1/listings/:listingId/images`, attach the token, and add up to five image files under the field name `images`. Files are limited to 5 MB each and are served from `/uploads`. Local upload storage is appropriate for development; switch to Cloudinary or S3 before deploying to an environment with ephemeral disks.

### Milestone 5: search, filters, and sorting

`GET /api/v1/listings` is public and supports these optional query parameters:

| Parameter | Description |
| --- | --- |
| `q` | Keyword search across listing title, description, and category. |
| `category` | Exact category match, case-insensitive. |
| `condition` | One of `new`, `like-new`, `good`, or `fair`. |
| `minPrice`, `maxPrice` | Inclusive non-negative price bounds. |
| `sort` | `newest` (default), `oldest`, `price_asc`, or `price_desc`. |
| `status`, `seller`, `page`, `limit` | Existing availability, seller, and pagination filters. `limit` is capped at 50. |

For example, this finds available good-condition electronics from ₹500 to ₹2,000, ordered from lowest price to highest:

```http
GET /api/v1/listings?q=calculator&category=Electronics&condition=good&minPrice=500&maxPrice=2000&status=available&sort=price_asc
```

Invalid filters return `400` with a clear message. Responses include the applied filters and pagination metadata alongside the matching listings.

## Buyer-Seller Messaging — Milestone 6

Messaging is intentionally listing-scoped: a buyer can open one conversation with a listing's seller, and only those two users can view or send messages. Notifications are not part of this milestone.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/conversations` | Lists the signed-in user's conversations, newest activity first. |
| POST | `/api/v1/conversations` | Starts or returns a buyer's conversation for a listing. |
| GET | `/api/v1/conversations/:conversationId/messages` | Returns a participant's conversation and its messages in chronological order. |
| POST | `/api/v1/conversations/:conversationId/messages` | Sends a message as a conversation participant. |

All messaging routes require `Authorization: Bearer <token>`. To start a chat, send a listing ID; `message` is optional and, when supplied, becomes the first message:

```json
{
  "listingId": "<listing-id>",
  "message": "Hi, is this calculator still available?"
}
```

To reply, send `{ "text": "Yes, you can collect it near the library." }`. Messages are trimmed plain text and limited to 1,000 characters. A seller cannot start a conversation for their own listing, sold listings cannot receive newly started chats, and existing participants retain access to their conversation after a listing is marked sold.

## Wishlist — Milestone 7

Wishlist is the single save-for-later feature; there is no separate saved-items collection. Every route requires `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/wishlist` | Returns the signed-in user's wishlisted listings, newest listings first. |
| POST | `/api/v1/wishlist/:listingId` | Adds an available listing to the wishlist. |
| DELETE | `/api/v1/wishlist/:listingId` | Removes a listing from the wishlist. |

Adding the same listing twice is safe and does not create duplicates. Users cannot wishlist their own listings or a listing that is already sold. If a seller later marks a saved listing as sold, it remains visible in the wishlist with its `sold` status so the buyer can remove it; deleted listings are cleaned up automatically when the wishlist is viewed.
