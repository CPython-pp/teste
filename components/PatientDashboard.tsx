import React, { useState, useEffect } from 'react';
import { Patient, HGTRecord } from '../types';
import { 
  calculateInsulinAdjustment, 
  formatRate, 
  formatHGT, 
  isValidHGT, 
  classifyGlycemia 
} from '../lib/insulin-protocol';
import { 
  scheduleHGTCheck, 
  scheduleUrgentAlert, 
  setupHGTIntervals,
  clearHGTIntervals 
} from '../lib/notifications';

interface PatientDashboardProps {
  patient: Patient;
  onPatientUpdated: (patient: Patient) => void;
}

export default function PatientDashboard({ patient, onPatientUpdated }: PatientDashboardProps) {
  const [hgtValue, setHgtValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [protocolMessage, setProtocolMessage] = useState('');

  // Configurar intervalos de notificação quando o componente for montado
  useEffect(() => {
    setupHGTIntervals(patient.id, patient.name);
    
    // Cleanup quando o componente for desmontado
    return () => {
      clearHGTIntervals(patient.id);
    };
  }, [patient.id, patient.name]);

  const handleHGTSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setProtocolMessage('');

    const hgt = parseFloat(hgtValue);

    // Validação
    if (!isValidHGT(hgt)) {
      setError('Valor de HGT deve estar entre 30 e 600 mg/dL');
      setLoading(false);
      return;
    }

    try {
      // Obter último HGT para cálculo do delta
      const lastHGT = patient.hgt_history.length > 0 
        ? patient.hgt_history[patient.hgt_history.length - 1].hgt_value
        : undefined;

      // Calcular ajuste de insulina
      const protocol = calculateInsulinAdjustment(
        hgt,
        patient.rate,
        lastHGT,
        patient.round_rate
      );

      // Atualizar paciente via API
      const response = await fetch('/api/patients', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: patient.id,
          hgt_value: hgt,
          new_rate: protocol.new_rate,
          action: protocol.action,
          notes: protocol.alert_message
        }),
      });

      const data = await response.json();

      if (data.success) {
        onPatientUpdated(data.data);
        setHgtValue('');
        setProtocolMessage(protocol.alert_message || '');

        // Agendar próxima verificação
        const nextCheck = new Date();
        nextCheck.setMinutes(nextCheck.getMinutes() + protocol.next_check_minutes);
        await scheduleHGTCheck(patient.name, patient.id, nextCheck);

        // Se for hipoglicemia severa, agendar alerta urgente
        if (protocol.action === 'hypoglycemia_protocol') {
          await scheduleUrgentAlert(
            patient.name,
            patient.id,
            'Hipoglicemia severa - Infundir 20 mL de glicose 50%',
            0
          );
        }
      } else {
        setError(data.error || 'Erro ao atualizar paciente');
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor');
      console.error('Error updating patient:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obter último HGT
  const lastHGT = patient.hgt_history.length > 0 
    ? patient.hgt_history[patient.hgt_history.length - 1]
    : null;

  const glycemiaClass = lastHGT ? classifyGlycemia(lastHGT.hgt_value) : null;

  return (
    <div className="space-y-6">
      {/* Status Atual */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-vita-dark mb-4">Status Atual</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-vita-blue/10 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-vita-blue mb-1">Vazão Atual</h3>
            <p className="text-2xl font-bold text-vita-blue">{formatRate(patient.rate)}</p>
          </div>
          
          <div className={`p-4 rounded-lg ${glycemiaClass ? 'bg-opacity-10' : 'bg-gray-100'}`}>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Último HGT</h3>
            {lastHGT ? (
              <>
                <p className={`text-2xl font-bold ${glycemiaClass?.color || 'text-gray-600'}`}>
                  {formatHGT(lastHGT.hgt_value)}
                </p>
                <p className={`text-xs ${glycemiaClass?.color || 'text-gray-500'}`}>
                  {glycemiaClass?.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(lastHGT.timestamp).toLocaleTimeString('pt-BR')}
                </p>
              </>
            ) : (
              <p className="text-gray-500">Nenhum registro</p>
            )}
          </div>
        </div>

        {/* Protocolo começado */}
        <div className="bg-vita-green/10 border border-vita-green/20 rounded-lg p-3 mb-4">
          <p className="text-sm text-vita-green font-medium">
            Protocolo iniciado em: {new Date(patient.start_time).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Entrada de HGT */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-vita-dark mb-4">Registrar HGT</h2>
        
        <form onSubmit={handleHGTSubmit} className="space-y-4">
          <div>
            <label htmlFor="hgt" className="block text-sm font-medium text-gray-700 mb-2">
              Valor de HGT (mg/dL)
            </label>
            <input
              type="number"
              id="hgt"
              value={hgtValue}
              onChange={(e) => setHgtValue(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vita-blue focus:border-vita-blue text-lg font-medium"
              placeholder="Digite o valor do HGT"
              min="30"
              max="600"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Valores normais: 90-180 mg/dL
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {protocolMessage && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
              <strong>Protocolo:</strong> {protocolMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-vita-green hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </>
            ) : (
              'Registrar HGT e Ajustar Protocolo'
            )}
          </button>
        </form>
      </div>

      {/* Histórico de HGT */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-vita-dark mb-4">Histórico de HGT</h2>
        
        {patient.hgt_history.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {[...patient.hgt_history].reverse().map((record: HGTRecord, index) => {
              const glycemia = classifyGlycemia(record.hgt_value);
              return (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-vita-blue">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <span className={`text-lg font-bold ${glycemia.color}`}>
                          {formatHGT(record.hgt_value)}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded-full ${glycemia.color} bg-opacity-10`}>
                          {glycemia.description}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Vazão:</strong> {formatRate(record.rate_before)} → {formatRate(record.rate_after)}
                        </p>
                        <p><strong>Ação:</strong> {record.action}</p>
                        {record.notes && (
                          <p><strong>Observações:</strong> {record.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right text-xs text-gray-500">
                      <p>{new Date(record.timestamp).toLocaleDateString('pt-BR')}</p>
                      <p>{new Date(record.timestamp).toLocaleTimeString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>Nenhum registro de HGT ainda</p>
            <p className="text-sm">Registre o primeiro valor para iniciar o monitoramento</p>
          </div>
        )}
      </div>

      {/* Lembretes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">Lembretes Importantes</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Verificar HGT a cada hora</li>
          <li>• Trocar solução de 20 mL a cada 6 horas</li>
          <li>• Em caso de hipoglicemia (&lt; 90 mg/dL), seguir protocolo específico</li>
          <li>• Comunicar médico em caso de alterações significativas</li>
        </ul>
      </div>
    </div>
  );
}