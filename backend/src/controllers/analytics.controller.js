const { getTenantClient } = require('../db/pool');

/** GET /api/analytics/summary */
const getSummary = async (req, res, next) => {
  const client = await getTenantClient(req.tenant.schema);
  try {
    const [usersRes, activeRes, activityRes, roleRes] = await Promise.all([
      client.query('SELECT COUNT(*) FROM users'),
      client.query('SELECT COUNT(*) FROM users WHERE is_active = TRUE'),
      client.query('SELECT COUNT(*) FROM activity_log WHERE created_at > NOW() - INTERVAL \'7 days\''),
      client.query('SELECT role, COUNT(*) as count FROM users GROUP BY role'),
    ]);

    const roleDistribution = {};
    roleRes.rows.forEach(r => { roleDistribution[r.role] = parseInt(r.count); });

    res.json({
      totalUsers:    parseInt(usersRes.rows[0].count),
      activeUsers:   parseInt(activeRes.rows[0].count),
      weeklyActions: parseInt(activityRes.rows[0].count),
      roleDistribution,
      tenant: req.tenant,
    });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

/** GET /api/analytics/activity */
const getActivity = async (req, res, next) => {
  const client = await getTenantClient(req.tenant.schema);
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const result = await client.query(
      `SELECT al.id, al.action, al.resource, al.meta, al.created_at,
              u.name as user_name, u.email as user_email, u.role as user_role
       FROM activity_log al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json({ activity: result.rows });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

/** GET /api/analytics/roles */
const getRoles = async (req, res, next) => {
  const client = await getTenantClient(req.tenant.schema);
  try {
    const result = await client.query(
      `SELECT role,
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE is_active) as active
       FROM users GROUP BY role ORDER BY role`
    );
    res.json({ roles: result.rows });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { getSummary, getActivity, getRoles };
