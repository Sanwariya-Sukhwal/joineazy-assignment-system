const roleMiddleware = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required role(s): ${requiredRoles.join(', ')}` 
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
