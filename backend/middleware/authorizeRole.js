/**
 * Role-Based Access Control Middleware Factory.
 * @param  {...string} allowedRoles - E.g. 'ADMIN', 'USER'
 */
export function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before authorization check.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to perform this action.',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    return next();
  };
}

export default authorizeRole;
