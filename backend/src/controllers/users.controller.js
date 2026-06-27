const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getTenantClient } = require('../db/pool');

/** GET /api/users */
const getUsers = async (req, res, next) => {
  const client = await getTenantClient(req.tenant.schema);
  try {
    const { role, department, status } = req.query;
    let sql = 'SELECT id, name, email, role, department, is_active, created_at, last_login FROM users WHERE 1=1';
    const params = [];

    if (role) { params.push(role); sql += ` AND role = $${params.length}`; }
    if (department) { params.push(department); sql += ` AND department ILIKE $${params.length}`; }
    if (status === 'active')   sql += ' AND is_active = TRUE';
    if (status === 'inactive') sql += ' AND is_active = FALSE';

    sql += ' ORDER BY created_at DESC';

    const result = await client.query(sql, params);
    res.json({ users: result.rows, total: result.rowCount });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

/** GET /api/users/:id */
const getUserById = async (req, res, next) => {
  const client = await getTenantClient(req.tenant.schema);
  try {
    const result = await client.query(
      'SELECT id, name, email, role, department, is_active, created_at, last_login FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

/** POST /api/users — Admin/Manager only */
const createUser = async (req, res, next) => {
  const client = await getTenantClient(req.tenant.schema);
  try {
    const { name, email, password = 'password123', role = 'viewer', department } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email are required' });

    // Managers cannot create admins
    if (req.user.role === 'manager' && role === 'admin') {
      return res.status(403).json({ error: 'Managers cannot create admin users' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await client.query(
      `INSERT INTO users (id, name, email, password, role, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, department, is_active, created_at`,
      [uuidv4(), name, email.toLowerCase(), hashed, role, department]
    );

    await client.query(
      'INSERT INTO activity_log (user_id, action, resource, meta) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'create_user', 'users', JSON.stringify({ created: email })]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    next(err);
  } finally {
    client.release();
  }
};

/** PATCH /api/users/:id */
const updateUser = async (req, res, next) => {
  const client = await getTenantClient(req.tenant.schema);
  try {
    const { name, role, department, is_active } = req.body;
    const { id } = req.params;

    // Managers cannot change roles to admin
    if (req.user.role === 'manager' && role === 'admin') {
      return res.status(403).json({ error: 'Managers cannot assign admin role' });
    }

    const result = await client.query(
      `UPDATE users SET
        name        = COALESCE($1, name),
        role        = COALESCE($2, role),
        department  = COALESCE($3, department),
        is_active   = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING id, name, email, role, department, is_active`,
      [name, role, department, is_active, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    await client.query(
      'INSERT INTO activity_log (user_id, action, resource, meta) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'update_user', 'users', JSON.stringify({ userId: id })]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

/** DELETE /api/users/:id — Admin only */
const deleteUser = async (req, res, next) => {
  const client = await getTenantClient(req.tenant.schema);
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });

    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id, name', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    await client.query(
      'INSERT INTO activity_log (user_id, action, resource, meta) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'delete_user', 'users', JSON.stringify({ deleted: result.rows[0].name })]
    );

    res.json({ message: 'User deleted', id });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
