import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import pool from '../../lib/db';
import { Patient, PatientForm, ApiResponse } from '../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Patient | Patient[]>>
) {
  // Verificar autenticação
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res);
        break;
      case 'POST':
        await handlePost(req, res, session.user.id);
        break;
      case 'PUT':
        await handlePut(req, res);
        break;
      case 'DELETE':
        await handleDelete(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).json({ success: false, error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// GET - Buscar pacientes
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id, status = 'active' } = req.query;
  const client = await pool.connect();

  try {
    if (id) {
      // Buscar paciente específico
      const result = await client.query(
        'SELECT * FROM patients WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }

      const patient = result.rows[0];
      return res.status(200).json({ success: true, data: patient });
    } else {
      // Buscar todos os pacientes ativos
      const result = await client.query(
        'SELECT * FROM patients WHERE status = $1 ORDER BY start_time DESC',
        [status]
      );
      
      return res.status(200).json({ success: true, data: result.rows });
    }
  } finally {
    client.release();
  }
}

// POST - Criar novo paciente
async function handlePost(
  req: NextApiRequest, 
  res: NextApiResponse, 
  userId: string
) {
  const patientData: PatientForm = req.body;
  
  // Validação básica
  if (!patientData.name || !patientData.age || !patientData.weight) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: name, age, weight' 
    });
  }

  // Calcular vazão inicial (0.1 UI/kg/h)
  let initialRate = patientData.weight * 0.1;
  
  // Arredondar se necessário
  if (patientData.round_rate) {
    initialRate = Math.round(initialRate);
  }

  const client = await pool.connect();

  try {
    const result = await client.query(`
      INSERT INTO patients (name, age, sector, bed, weight, rate, round_rate, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      patientData.name,
      patientData.age,
      patientData.sector,
      patientData.bed,
      patientData.weight,
      initialRate,
      patientData.round_rate,
      parseInt(userId)
    ]);

    const newPatient = result.rows[0];
    return res.status(201).json({ success: true, data: newPatient });
  } finally {
    client.release();
  }
}

// PUT - Atualizar paciente (HGT, vazão, etc.)
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id, hgt_value, action, new_rate, notes } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Patient ID required' });
  }

  const client = await pool.connect();

  try {
    // Buscar paciente atual
    const patientResult = await client.query(
      'SELECT * FROM patients WHERE id = $1',
      [id]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const patient = patientResult.rows[0];
    
    if (hgt_value !== undefined) {
      // Adicionar novo registro de HGT ao histórico
      const newHGTRecord = {
        timestamp: new Date().toISOString(),
        hgt_value,
        rate_before: patient.rate,
        rate_after: new_rate || patient.rate,
        action: action || 'check',
        notes
      };

      const updatedHistory = [...(patient.hgt_history || []), newHGTRecord];

      // Atualizar paciente com novo HGT e vazão
      const updateResult = await client.query(`
        UPDATE patients 
        SET rate = $1, hgt_history = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [new_rate || patient.rate, JSON.stringify(updatedHistory), id]);

      return res.status(200).json({ success: true, data: updateResult.rows[0] });
    }

    // Outras atualizações (status, dados gerais)
    const { status, ...updateData } = req.body;
    const updateFields = Object.keys(updateData)
      .filter(key => key !== 'id')
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    if (updateFields) {
      const values = Object.values(updateData);
      const updateResult = await client.query(`
        UPDATE patients 
        SET ${updateFields}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id, ...values]);

      return res.status(200).json({ success: true, data: updateResult.rows[0] });
    }

    return res.status(400).json({ success: false, error: 'No fields to update' });
  } finally {
    client.release();
  }
}

// DELETE - Excluir paciente (soft delete)
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Patient ID required' });
  }

  const client = await pool.connect();

  try {
    const result = await client.query(`
      UPDATE patients 
      SET status = 'completed', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Patient status updated to completed' 
    });
  } finally {
    client.release();
  }
}