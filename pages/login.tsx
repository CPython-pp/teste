import React, { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Verificar se já está autenticado
  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push('/');
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciais inválidas. Verifique usuário e senha.');
      } else {
        router.push('/');
      }
    } catch (error) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>VitaFlow - Login</title>
        <meta name="description" content="VitaFlow - Protocolo de Insulina" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-vita-blue to-vita-green flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {/* Logo e Título */}
          <div className="text-center">
            <div className="mx-auto h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6">
              <VitaFlowIcon />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">VitaFlow</h2>
            <p className="text-vita-white/80">Protocolo de Insulina Hospitalar</p>
          </div>

          {/* Formulário de Login */}
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-vita-dark mb-2">
                  Usuário
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vita-blue focus:border-vita-blue transition-colors"
                  placeholder="Digite seu usuário"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-vita-dark mb-2">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vita-blue focus:border-vita-blue transition-colors"
                  placeholder="Digite sua senha"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

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
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            {/* Credenciais padrão para demo */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">Credenciais padrão:</p>
              <div className="text-sm text-gray-500 space-y-1">
                <p><strong>Usuário:</strong> admin</p>
                <p><strong>Senha:</strong> admin123</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-vita-white/60 text-sm">
              © 2025 VitaFlow. Sistema hospitalar para protocolo de insulina.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// Componente do ícone VitaFlow (gota azul com curva verde)
function VitaFlowIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gota azul */}
      <path
        d="M24 4C16 12 12 18 12 24C12 30.627 17.373 36 24 36C30.627 36 36 30.627 36 24C36 18 32 12 24 4Z"
        fill="#488AFF"
      />
      {/* Curva verde */}
      <path
        d="M18 24C18 20.5 20 17.5 24 14C28 17.5 30 20.5 30 24C30 27.314 27.314 30 24 30C20.686 30 18 27.314 18 24Z"
        fill="#4CAF50"
        opacity="0.8"
      />
      {/* Reflexo */}
      <ellipse
        cx="21"
        cy="20"
        rx="3"
        ry="4"
        fill="white"
        opacity="0.3"
        transform="rotate(-15 21 20)"
      />
    </svg>
  );
}