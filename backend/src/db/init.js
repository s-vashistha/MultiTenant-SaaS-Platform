const { pool } = require('../db/pool');
const bcrypt = require('bcryptjs');

const TENANTS = [
  { name: 'Acme Corp',     slug: 'acme_corp',     plan: 'enterprise' },
  { name: 'Nova Studios',  slug: 'nova_studios',  plan: 'pro'        },
  { name: 'Zeta Finance',  slug: 'zeta_finance',  plan: 'starter'    },
];

const ROLES = ['admin', 'manager', 'viewer'];

// Seed users per tenant
const SEED_USERS = {
  acme_corp: [
    { name: 'Arjun Singh',  email: 'arjun@acme.com',  role: 'admin',   department: 'Engineering' },
    { name: 'Priya Mehta',  email: 'priya@acme.com',  role: 'manager', department: 'Operations'  },
    { name: 'Rahul Dev',    email: 'rahul@acme.com',  role: 'viewer',  department: 'Sales'       },
    { name: 'Sneha Rao',    email: 'sneha@acme.com',  role: 'manager', department: 'HR'          },
    { name: 'Karan Joshi',  email: 'karan@acme.com',  role: 'viewer',  department: 'Marketing'   },
  ],
  nova_studios: [
    { name: 'Ananya Shah',  email: 'ananya@nova.io',  role: 'admin',   department: 'Design'  },
    { name: 'Dev Patel',    email: 'dev@nova.io',     role: 'manager', department: 'Content' },
    { name: 'Ishaan Malik', email: 'ishaan@nova.io',  role: 'viewer',  department: 'Creative'},
  ],
  zeta_finance: [
    { name: 'Ria Kapoor',   email: 'ria@zeta.com',    role: 'admin',   department: 'Finance'    },
    { name: 'Nikhil Sinha', email: 'nikhil@zeta.com', role: 'manager', department: 'Compliance' },
    { name: 'Pooja Gupta',  email: 'pooja@zeta.com',  role: 'viewer',  department: 'Audit'      },
  ],
};

async function initDB() {
  const client = await pool.connect();
  try {
    console.log('🔧 Initializing database...');

    // ── Public schema: tenants registry ──────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.tenants (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL,
        slug        TEXT UNIQUE NOT NULL,
        plan        TEXT NOT NULL DEFAULT 'starter',
        schema_name TEXT UNIQUE NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Per-tenant schemas ────────────────────────────────────────────
    for (const tenant of TENANTS) {
      const schema = `tenant_${tenant.slug}`;
      console.log(`  → Creating schema: ${schema}`);

      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);

      // Users table (isolated per tenant)
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${schema}.users (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name        TEXT NOT NULL,
          email       TEXT UNIQUE NOT NULL,
          password    TEXT NOT NULL,
          role        TEXT NOT NULL CHECK (role IN ('admin','manager','viewer')),
          department  TEXT,
          is_active   BOOLEAN DEFAULT TRUE,
          created_at  TIMESTAMPTZ DEFAULT NOW(),
          last_login  TIMESTAMPTZ
        )
      `);

      // Refresh tokens (isolated per tenant)
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${schema}.refresh_tokens (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id     UUID REFERENCES ${schema}.users(id) ON DELETE CASCADE,
          token       TEXT NOT NULL,
          expires_at  TIMESTAMPTZ NOT NULL,
          created_at  TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Activity log (isolated per tenant)
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${schema}.activity_log (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id     UUID REFERENCES ${schema}.users(id) ON DELETE SET NULL,
          action      TEXT NOT NULL,
          resource    TEXT,
          meta        JSONB,
          created_at  TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Upsert tenant in public registry
      await client.query(`
        INSERT INTO public.tenants (name, slug, plan, schema_name)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug) DO UPDATE SET name = $1, plan = $3
      `, [tenant.name, tenant.slug, tenant.plan, schema]);

      // Seed users
      const defaultPassword = await bcrypt.hash('password123', 10);
      for (const u of SEED_USERS[tenant.slug] || []) {
        await client.query(`
          INSERT INTO ${schema}.users (name, email, password, role, department)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (email) DO NOTHING
        `, [u.name, u.email, defaultPassword, u.role, u.department]);
      }

      console.log(`  ✓ ${tenant.name} ready (${(SEED_USERS[tenant.slug]||[]).length} users seeded)`);
    }

    console.log('\n✅ Database initialized successfully!');
    console.log('\n📋 Login credentials (password: password123):');
    for (const [slug, users] of Object.entries(SEED_USERS)) {
      console.log(`\n  ${slug.replace('_', ' ').toUpperCase()}:`);
      users.forEach(u => console.log(`    ${u.role.padEnd(8)} → ${u.email}`));
    }

  } finally {
    client.release();
  }
}

module.exports = { initDB };
