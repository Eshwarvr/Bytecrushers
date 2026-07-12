import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase';

export interface AuthenticatedRequest extends Request {
  user?: any;
  employee?: {
    id: string;
    name: string;
    email: string;
    department_id: string | null;
    role: string;
    status: string;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }

    req.user = user;

    // Fetch corresponding employee record bypassing RLS using the admin client
    let { data: employee, error: empError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (empError || !employee) {
      // Auto-create for hackathon robustness!
      const newEmployee = {
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Hackathon User',
        email: user.email,
        role: 'Admin',
        status: 'Active',
        auth_user_id: user.id
      };
      await supabaseAdmin.from('employees').insert(newEmployee);
      employee = newEmployee as any;
    }

    if (employee.status !== 'Active') {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    req.employee = employee;
    next();
  } catch (err: any) {
    console.error('Error in requireAuth middleware:', err);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.employee) {
      return res.status(401).json({ error: 'Unauthorized profile' });
    }

    if (!allowedRoles.includes(req.employee.role)) {
      return res.status(403).json({ error: `Forbidden: requires one of the following roles: ${allowedRoles.join(', ')}` });
    }

    next();
  };
}
