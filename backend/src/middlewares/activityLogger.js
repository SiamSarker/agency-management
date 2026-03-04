const ActivityLog = require('../models/ActivityLog');

const logActivity = (action, module, description) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      if (data.success && req.user) {
        ActivityLog.create({
          user: req.user._id,
          action,
          module,
          description,
          resourceType: module,
          resourceId: data.data?._id || req.params.id,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          metadata: {
            method: req.method,
            url: req.originalUrl
          }
        }).catch(err => console.error('Activity log error:', err));
      }

      return originalJson(data);
    };

    next();
  };
};

const logActivityWithChanges = (action, module) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      if (data.success && req.user) {
        const logData = {
          user: req.user._id,
          action,
          module,
          description: `${action} ${module}`,
          resourceType: module,
          resourceId: data.data?._id || req.params.id,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          metadata: {
            method: req.method,
            url: req.originalUrl
          }
        };

        if (req.body && action === 'update') {
          logData.changes = {
            after: req.body
          };
        }

        ActivityLog.create(logData).catch(err => console.error('Activity log error:', err));
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = { logActivity, logActivityWithChanges };
