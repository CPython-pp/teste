import React, { useState, useEffect } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Patient } from '../types';
import { formatRate, formatHGT, classifyGlycemia } from '../lib/insulin-protocol';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'active',
    sector: '',
    date: ''
  });
  const [error, setError] = useState('');

  // Verificar autenticação e permissão de admin
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    loadPatients();
  }, [session, status, router, filter]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.sector) params.append('sector', filter.sector);
      if (filter.date) params.append('date', filter.date);

      const response = await fetch(`/api/patients?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setPatients(data.data);
      } else {
        setError(data.error || 'Erro ao carregar pacientes');
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor');
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async (patientId: number) => {
    if (!confirm('Tem certeza que deseja finalizar este protocolo?')) return;

    try {
      const response = await fetch(`/api/patients?id=${patientId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await loadPatients(); // Recarregar lista
      } else {
        setError(data.error || 'Erro ao finalizar protocolo');
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor');
      console.error('Error deleting patient:', error);
    }
  };

  const exportToCSV = () => {
    if (patients.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    const headers = [
      'Nome',
      'Idade',
      'Setor',
      'Leito',
      'Peso',
      'Vazão Atual',
      'Último HGT',
      'Status',
      'Início do Protocolo',
      'Última Atualização'
    ];

    const csvData = patients.map(patient => {
      const lastHGT = patient.hgt_history.length > 0 
        ? patient.hgt_history[patient.hgt_history.length - 1].hgt_value
        : '';
      
      return [
        patient.name,
        patient.age,
        patient.sector,
        patient.bed,
        patient.weight,
        patient.rate,
        lastHGT,
        patient.status,
        new Date(patient.start_time).toLocaleString('pt-BR'),
        new Date(patient.updated_at).toLocaleString('pt-BR')
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vitaflow-patients-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-vita-gray flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-vita-blue mx-auto mb-4"></div>
          <p className="text-vita-dark">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <>
      <Head>
        <title>VitaFlow - Administração</title>
        <meta name="description" content="VitaFlow - Painel administrativo" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-vita-gray">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/')}
                  className="h-10 w-10 bg-vita-blue rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                >
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-vita-dark">Administração</h1>
                  <p className="text-sm text-gray-600">Gerenciamento de Pacientes</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Admin: {session.user?.username}
                </span>
                <button
                  onClick={() => router.push('/api/auth/signout')}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filtros e Ações */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <select
                  value={filter.status}
                  onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vita-blue"
                >
                  <option value="active">Ativos</option>
                  <option value="completed">Finalizados</option>
                  <option value="">Todos</option>
                </select>

                <select
                  value={filter.sector}
                  onChange={(e) => setFilter(prev => ({ ...prev, sector: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vita-blue"
                >
                  <option value="">Todos os setores</option>
                  <option value="COENF">COENF</option>
                  <option value="Ortopedia">Ortopedia</option>
                  <option value="Cardiologia">Cardiologia</option>
                  <option value="UTI">UTI</option>
                  <option value="Neurologia">Neurologia</option>
                  <option value="Pneumologia">Pneumologia</option>
                  <option value="Gastroenterologia">Gastroenterologia</option>
                  <option value="Oncologia">Oncologia</option>
                </select>

                <input
                  type="date"
                  value={filter.date}
                  onChange={(e) => setFilter(prev => ({ ...prev, date: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vita-blue"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={exportToCSV}
                  disabled={patients.length === 0}
                  className="bg-vita-green hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Exportar CSV</span>
                </button>

                <button
                  onClick={loadPatients}
                  className="bg-vita-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Atualizar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Pacientes */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-vita-dark">
                Pacientes ({patients.length})
              </h2>
            </div>

            {error && (
              <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {patients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paciente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Localização
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Protocolo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patients.map((patient) => {
                      const lastHGT = patient.hgt_history.length > 0 
                        ? patient.hgt_history[patient.hgt_history.length - 1]
                        : null;
                      const glycemiaClass = lastHGT ? classifyGlycemia(lastHGT.hgt_value) : null;

                      return (
                        <tr key={patient.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {patient.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {patient.age} anos • {patient.weight} kg
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {patient.sector}
                            </div>
                            <div className="text-sm text-gray-500">
                              Leito {patient.bed}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-vita-blue">
                              {formatRate(patient.rate)}
                            </div>
                            {lastHGT && (
                              <div className={`text-sm ${glycemiaClass?.color}`}>
                                {formatHGT(lastHGT.hgt_value)}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              Início: {new Date(patient.start_time).toLocaleDateString('pt-BR')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              patient.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {patient.status === 'active' ? 'Ativo' : 'Finalizado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => router.push(`/?patient=${patient.id}`)}
                                className="text-vita-blue hover:text-blue-600 transition-colors"
                                title="Ver detalhes"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              
                              {patient.status === 'active' && (
                                <button
                                  onClick={() => handleDeletePatient(patient.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                  title="Finalizar protocolo"
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum paciente encontrado
                </h3>
                <p className="text-gray-500">
                  Não há pacientes com os filtros aplicados.
                </p>
              </div>
            )}
          </div>

          {/* Estatísticas Rápidas */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-vita-blue rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Pacientes Ativos</p>
                  <p className="text-2xl font-semibold text-vita-dark">
                    {patients.filter(p => p.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-vita-green rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Protocolos Finalizados</p>
                  <p className="text-2xl font-semibold text-vita-dark">
                    {patients.filter(p => p.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total de Registros HGT</p>
                  <p className="text-2xl font-semibold text-vita-dark">
                    {patients.reduce((total, p) => total + p.hgt_history.length, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// Proteção de rota para admin
export async function getServerSideProps(context: any) {
  const session = await getSession(context);

  if (!session || session.user?.role !== 'admin') {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}