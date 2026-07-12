import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../lib/supabase';

// 1. Asset Registry CRUD
export async function createAsset(req: AuthenticatedRequest, res: Response) {
  const { name, type, status, category_id, custom_attributes } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Name and Type are required' });
  }

  try {
    const { data: asset, error } = await supabaseAdmin
      .from('assets')
      .insert([{ 
        name, 
        type, 
        status: status || 'available',
        category_id: category_id || null,
        custom_attributes: custom_attributes || {}
      }])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(asset);
  } catch (error: any) {
    console.error('Create asset error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create asset' });
  }
}

export async function listAssets(req: AuthenticatedRequest, res: Response) {
  try {
    const { data: assets, error } = await supabaseAdmin
      .from('assets')
      .select(`
        *,
        category:asset_categories!category_id(*)
      `);

    if (error) throw error;
    return res.status(200).json(assets);
  } catch (error: any) {
    console.error('List assets error:', error);
    return res.status(500).json({ error: error.message || 'Failed to list assets' });
  }
}

export async function getAssetById(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  try {
    const { data: asset, error } = await supabaseAdmin
      .from('assets')
      .select(`
        *,
        category:asset_categories!category_id(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return res.status(200).json(asset);
  } catch (error: any) {
    console.error('Get asset error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get asset' });
  }
}

export async function updateAsset(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { name, type, status, category_id, custom_attributes } = req.body;

  try {
    const updateData: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (category_id !== undefined) updateData.category_id = category_id || null;
    if (custom_attributes !== undefined) updateData.custom_attributes = custom_attributes;

    const { data: asset, error } = await supabaseAdmin
      .from('assets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json(asset);
  } catch (error: any) {
    console.error('Update asset error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update asset' });
  }
}

export async function deleteAsset(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  try {
    // Business Rule check: ensure asset is not currently allocated?
    // According to specs, respect business rules (Admin/AssetManager can delete, but maybe block if 'allocated')
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('assets')
      .select('status')
      .eq('id', id)
      .single();

    if (checkError) throw checkError;
    if (existing?.status === 'allocated') {
      return res.status(400).json({ error: 'Cannot delete an allocated asset. Return it first.' });
    }

    const { error } = await supabaseAdmin
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.status(200).json({ message: 'Asset deleted successfully' });
  } catch (error: any) {
    console.error('Delete asset error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete asset' });
  }
}
