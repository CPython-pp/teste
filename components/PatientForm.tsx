import React, { useState } from 'react';
import { PatientForm as PatientFormType, Patient, SECTORS } from '../types';
import { calculateInitialRate } from '../lib/insulin-protocol';

interface PatientFormProps {
  onPatientCreated: (patient: Patient) => void;
}

export default function PatientForm({ onPatientCreated }: PatientFormProps) {
  const [formData, setFormData] = useState<PatientFormType>({
    name: '',
    age: 0,
    sector: '',
    bed: 0,
    weight: 0,
    round_rate: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validação básica
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      setLoading(false);
      return;
    }

    if (formData.age < 1 || formData.age > 120) {
      setError('Idade deve ser entre 1 e 120 anos');
      setLoading(false);
      return;
    }

    if (formData.weight < 1 || formData.weight > 300) {
      setError('Peso deve ser entre 1 e 300 kg');
      setLoading(false);
      return;
    }

    if (formData.bed < 1) {
      setError('Número do leito é obrigatório');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onPatientCreated(data.data);
        // Reset form
        setFormData({
          name: '',
          age: 0,
          sector: '',
          bed: 0,
          weight: 0,
          round_rate: true,
        });
      } else {
        setError(data.error || 'Erro ao cadastrar paciente');
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor');
      console.error('Error creating patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PatientFormType, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calcular preview da vazão inicial
  const previewRate = formData.weight > 0 
    ? calculateInitialRate(formData.weight, formData.round_rate)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nome */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nome do Paciente *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vita-blue focus:border-vita-blue"
          placeholder="Digite o nome completo"
          required
        />
      </div>

      {/* Idade */}
      <div>
        <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
          Idade *
        </label>
        <input
          type="number"
          id="age"
          value={formData.age || ''}
          onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vita-blue focus:border-vita-blue"
          placeholder="Anos"
          min="1"
          max="120"
          required
        />
      </div>

      {/* Setor */}
      <div>
        <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1">
          Setor *
        </label>
        <select
          id="sector"
          value={formData.sector}
          onChange={(e) => handleInputChange('sector', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vita-blue focus:border-vita-blue"
          required
        >
          <option value="">Selecione o setor</option>
          {SECTORS.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>

      {/* Leito */}
      <div>
        <label htmlFor="bed" className="block text-sm font-medium text-gray-700 mb-1">
          Leito *
        </label>
        <input
          type="number"
          id="bed"
          value={formData.bed || ''}
          onChange={(e) => handleInputChange('bed', parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vita-blue focus:border-vita-blue"
          placeholder="Número do leito"
          min="1"
          required
        />
      </div>

      {/* Peso */}
      <div>
        <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
          Peso (kg) *
        </label>
        <input
          type="number"
          id="weight"
          value={formData.weight || ''}
          onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vita-blue focus:border-vita-blue"
          placeholder="Peso em quilogramas"
          min="1"
          max="300"
          step="0.1"
          required
        />
      </div>

      {/* Arredondamento de Vazão */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="round_rate"
          checked={formData.round_rate}
          onChange={(e) => handleInputChange('round_rate', e.target.checked)}
          className="w-4 h-4 text-vita-blue bg-gray-100 border-gray-300 rounded focus:ring-vita-blue focus:ring-2"
        />
        <label htmlFor="round_rate" className="text-sm font-medium text-gray-700">
          Arredondar vazão de insulina
        </label>
      </div>

      {/* Preview da Vazão */}
      {formData.weight > 0 && (
        <div className="bg-vita-blue/10 border border-vita-blue/20 rounded-lg p-3">
          <p className="text-sm text-vita-blue font-medium">
            Vazão inicial calculada: {previewRate} UI/h
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Baseado em 0,1 UI/kg/h {formData.round_rate ? '(arredondado)' : '(exato)'}
          </p>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Botão de Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-vita-blue hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cadastrando...
          </>
        ) : (
          'Iniciar Protocolo de Insulina'
        )}
      </button>

      {/* Informações Adicionais */}
      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Protocolo de Insulina</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Vazão inicial: 0,1 UI/kg/h</li>
          <li>• Verificação de HGT a cada hora</li>
          <li>• Troca de solução a cada 6 horas</li>
          <li>• Ajustes automáticos baseados no protocolo médico</li>
        </ul>
      </div>
    </form>
  );
}