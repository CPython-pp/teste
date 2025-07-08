import React, { useState, useEffect } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import PatientForm from '../components/PatientForm';
import PatientDashboard from '../components/PatientDashboard';
import { Patient } from '../types';
import { initializeNotifications } from '../lib/notifications';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar autenticação
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    // Inicializar notificações
    initializeNotifications();
    
    // Carregar paciente ativo se existir
    loadActivePatient();
  }, [session, status, router]);

  const loadActivePatient = async () => {
    try {
      const response = await fetch('/api/patients?status=active');
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        // Pegar o primeiro paciente ativo
        setCurrentPatient(data.data[0]);
      }
    } catch (error) {
      console.error('Error loading active patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientCreated = (patient: Patient) => {
    setCurrentPatient(patient);
  };

  const handlePatientUpdated = (patient: Patient) => {
    setCurrentPatient(patient);
  };

  const handleLogout = () => {
    router.push('/api/auth/signout');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-vita-gray flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-vita-blue mx-auto mb-4"></div>
          <p className="text-vita-dark">Carregando VitaFlow...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>VitaFlow - Protocolo de Insulina</title>
        <meta name="description" content="VitaFlow - Sistema de protocolo de insulina hospitalar" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-vita-gray">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-vita-blue rounded-full flex items-center justify-center">
                  <VitaFlowIcon />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-vita-dark">VitaFlow</h1>
                  <p className="text-sm text-gray-600">Protocolo de Insulina</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Olá, {session.user?.username}
                </span>
                {session.user?.role === 'admin' && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="bg-vita-green text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
                  >
                    Administração
                  </button>
                )}
                <button
                  onClick={handleLogout}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário de Paciente - Lado Esquerdo */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-vita-dark mb-6">
                  {currentPatient ? 'Paciente Atual' : 'Novo Paciente'}
                </h2>
                
                {!currentPatient ? (
                  <PatientForm onPatientCreated={handlePatientCreated} />
                ) : (
                  <div className="space-y-4">
                    <div className="bg-vita-gray p-4 rounded-lg">
                      <h3 className="font-medium text-vita-dark mb-2">Informações do Paciente</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Nome:</span>
                          <p className="font-medium">{currentPatient.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Idade:</span>
                          <p className="font-medium">{currentPatient.age} anos</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Setor:</span>
                          <p className="font-medium">{currentPatient.sector}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Leito:</span>
                          <p className="font-medium">{currentPatient.bed}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Peso:</span>
                          <p className="font-medium">{currentPatient.weight} kg</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Vazão Atual:</span>
                          <p className="font-medium text-vita-blue">{currentPatient.rate} UI/h</p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setCurrentPatient(null)}
                      className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Finalizar Protocolo
                    </button>
                  </div>
                )}
              </div>

              {/* Ícone Central como Marca d'Água */}
              <div className="hidden lg:block">
                <div className="flex justify-center opacity-10">
                  <div className="h-32 w-32">
                    <svg width="128" height="128" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M24 4C16 12 12 18 12 24C12 30.627 17.373 36 24 36C30.627 36 36 30.627 36 24C36 18 32 12 24 4Z"
                        fill="#488AFF"
                      />
                      <path
                        d="M18 24C18 20.5 20 17.5 24 14C28 17.5 30 20.5 30 24C30 27.314 27.314 30 24 30C20.686 30 18 27.314 18 24Z"
                        fill="#4CAF50"
                        opacity="0.8"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard do Paciente - Lado Direito */}
            <div className="space-y-6">
              {currentPatient ? (
                <PatientDashboard 
                  patient={currentPatient}
                  onPatientUpdated={handlePatientUpdated}
                />
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="text-center py-12">
                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum Paciente Ativo</h3>
                    <p className="text-gray-500">Cadastre um paciente para iniciar o protocolo de insulina.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// Componente do ícone pequeno para header
function VitaFlowIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M24 4C16 12 12 18 12 24C12 30.627 17.373 36 24 36C30.627 36 36 30.627 36 24C36 18 32 12 24 4Z"
        fill="white"
      />
      <path
        d="M18 24C18 20.5 20 17.5 24 14C28 17.5 30 20.5 30 24C30 27.314 27.314 30 24 30C20.686 30 18 27.314 18 24Z"
        fill="#4CAF50"
        opacity="0.8"
      />
    </svg>
  );
}

// Proteção de rota para autenticação
export async function getServerSideProps(context: any) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}