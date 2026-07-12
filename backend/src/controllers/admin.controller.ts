import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../lib/supabase';

// 1. Employee Directory and Promotion
export async function createEmployee(req: AuthenticatedRequest, res: Response) {
  const { name, email, role, department_id } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and Email are required' });
  }

  try {
    // Provision credentials via Supabase Admin Authentication SDK
    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'TemporaryPassword123!',
      email_confirm: true,
      user_metadata: { name }
    });

    if (createError) throw createError;

    // The trigger handle_new_user() automatically created the employee record.
    // We now customize their rank (role) and department from the admin parameters.
    const { data: updatedEmployee, error: updateError } = await supabaseAdmin
      .from('employees')
      .update({ 
        role: role || 'Employee',
        department_id: department_id || null
      })
      .eq('auth_user_id', data.user.id)
      .select()
      .single();

    if (updateError) throw updateError;
    return res.status(201).json(updatedEmployee);
  } catch (error: any) {
    console.error('Create employee error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create employee' });
  }
}

export async function listEmployees(req: AuthenticatedRequest, res: Response) {
  try {
    const { data: employees, error } = await supabaseAdmin
      .from('employees')
      .select(`
        *,
        department:departments!department_id(id, name)
      `);

    if (error) throw error;
    return res.status(200).json(employees);
  } catch (error: any) {
    console.error('List employees error:', error);
    return res.status(500).json({ error: error.message || 'Failed to list employees' });
  }
}

export async function updateEmployee(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { role, department_id, status } = req.body;

  try {
    // Prevent self-role-demotion of the current admin for safety
    if (id === req.employee?.id && role && role !== 'Admin') {
      return res.status(400).json({ error: 'You cannot change or demote your own Admin role' });
    }

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (department_id !== undefined) updateData.department_id = department_id || null;
    if (status !== undefined) updateData.status = status;

    const { data: updatedEmployee, error } = await supabaseAdmin
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json(updatedEmployee);
  } catch (error: any) {
    console.error('Update employee error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update employee' });
  }
}

// 2. Department Management
export async function listDepartments(req: AuthenticatedRequest, res: Response) {
  try {
    const { data: departments, error } = await supabaseAdmin
      .from('departments')
      .select(`
        *,
        head:employees!head_id(id, name)
      `);

    if (error) throw error;
    return res.status(200).json(departments);
  } catch (error: any) {
    console.error('List departments error:', error);
    return res.status(500).json({ error: error.message || 'Failed to list departments' });
  }
}

export async function createDepartment(req: AuthenticatedRequest, res: Response) {
  const { name, code, parent_department_id, head_id, status } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Name and Code are required' });
  }

  try {
    const { data: department, error } = await supabaseAdmin
      .from('departments')
      .insert([{ 
        name, 
        code, 
        parent_department_id: parent_department_id || null, 
        head_id: head_id || null,
        status: status || 'Active'
      }])
      .select()
      .single();

    if (error) throw error;

    // If head_id is assigned, automatically elevate that employee's role to DepartmentHead
    if (head_id) {
      await supabaseAdmin
        .from('employees')
        .update({ role: 'DepartmentHead', department_id: department.id })
        .eq('id', head_id);
    }

    return res.status(201).json(department);
  } catch (error: any) {
    console.error('Create department error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create department' });
  }
}

export async function updateDepartment(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { name, code, parent_department_id, head_id, status } = req.body;

  try {
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (parent_department_id !== undefined) updateData.parent_department_id = parent_department_id || null;
    if (head_id !== undefined) updateData.head_id = head_id || null;
    if (status !== undefined) updateData.status = status;

    const { data: department, error } = await supabaseAdmin
      .from('departments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If head_id is updated and valid, set the employee's role to DepartmentHead
    if (head_id) {
      await supabaseAdmin
        .from('employees')
        .update({ role: 'DepartmentHead', department_id: id })
        .eq('id', head_id);
    }

    return res.status(200).json(department);
  } catch (error: any) {
    console.error('Update department error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update department' });
  }
}

// 3. Asset Category Management
export async function listCategories(req: AuthenticatedRequest, res: Response) {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('asset_categories')
      .select('*');

    if (error) throw error;
    return res.status(200).json(categories);
  } catch (error: any) {
    console.error('List categories error:', error);
    return res.status(500).json({ error: error.message || 'Failed to list categories' });
  }
}

export async function createCategory(req: AuthenticatedRequest, res: Response) {
  const { name, custom_fields } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const { data: category, error } = await supabaseAdmin
      .from('asset_categories')
      .insert([{ name, custom_fields: custom_fields || [] }])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(category);
  } catch (error: any) {
    console.error('Create category error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create category' });
  }
}

export async function updateCategory(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { name, custom_fields } = req.body;

  try {
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (custom_fields !== undefined) updateData.custom_fields = custom_fields;

    const { data: category, error } = await supabaseAdmin
      .from('asset_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json(category);
  } catch (error: any) {
    console.error('Update category error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update category' });
  }
}

export async function deleteCategory(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin
      .from('asset_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Delete category error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete category' });
  }
}
