# Future Thinking - Backend

## Supabase Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Save your project URL and keys

### 2. Execute SQL Scripts (In Order)

Run in Supabase SQL Editor:

```
1. supabase/schema.sql      → Creates all tables
2. supabase/rls_policies.sql → Enables RLS
3. supabase/storage.sql      → Creates storage buckets
4. supabase/seed.sql         → Sample data (optional)
```

### 3. Create Initial Users

In Supabase Dashboard → Authentication → Users:

| Email | Role | Metadata |
|-------|------|----------|
| admin@futurethinking.com | admin |  |

### 4. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set MOYASAR_SECRET_KEY=sk_test_xxx
supabase secrets set GEMINI_API_KEY=your_gemini_key

# Deploy functions
supabase functions deploy create-payment
supabase functions deploy verify-payment
supabase functions deploy applepay-payment
supabase functions deploy generate-ai-content
```

### 5. Configure Moyasar Webhook

In Moyasar Dashboard:
- Add webhook URL: `https://YOUR_PROJECT.supabase.co/functions/v1/verify-payment`

### 6. Environment Variables

Create `.env.local` in Frontend:

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx
VITE_GEMINI_API_KEY=AIzaxxx
```

## Folder Structure

```
Backend/
├── supabase/
│   ├── schema.sql
│   ├── rls_policies.sql
│   ├── storage.sql
│   ├── seed.sql
│   └── functions/
│       ├── create-payment/
│       │   └── index.ts
│       ├── verify-payment/
│       │   └── index.ts
│       ├── applepay-payment/
│       │   └── index.ts
│       └── generate-ai-content/
│           └── index.ts
└── README.md
```

## Edge Functions

| Function | Purpose |
|----------|---------|
| `create-payment` | Create Moyasar invoice |
| `verify-payment` | Webhook for payment confirmation |
| `applepay-payment` | Apple Pay tokens |
| `generate-ai-content` | Gemini AI for course content |
