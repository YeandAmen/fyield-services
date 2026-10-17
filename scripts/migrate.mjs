import { getMigrations } from 'better-auth/db/migration';
import { getAuth, pool } from '../lib/auth.js';
const {runMigrations}=await getMigrations(getAuth().options);
await runMigrations();
await pool.query(`
CREATE TABLE IF NOT EXISTS provider_profiles(
 id uuid PRIMARY KEY, user_id text UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 details jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio_photos(
 id uuid PRIMARY KEY, user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 url text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portfolio_owner_idx ON portfolio_photos(user_id);
CREATE TABLE IF NOT EXISTS customer_reviews(
 id uuid PRIMARY KEY, profile_id uuid NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5), comment text NOT NULL CHECK(length(comment) BETWEEN 20 AND 1200),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(profile_id,user_id)
);
CREATE TABLE IF NOT EXISTS write_limits(
 key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS service_enquiries(
 id uuid PRIMARY KEY, profile_id uuid NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
 customer_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 message text NOT NULL, reply text, created_at timestamptz NOT NULL DEFAULT now(), replied_at timestamptz
);
`);
console.log('Authentication and marketplace tables are ready.');
await pool.end();
