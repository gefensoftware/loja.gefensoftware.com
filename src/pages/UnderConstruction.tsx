import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const UnderConstruction = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-0 bg-white">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            {/* Ícone mais neutro - engrenagem */}
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-600 to-slate-700 rounded-full flex items-center justify-center shadow-lg">
              <svg 
                className="w-12 h-12 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              🚧 Página em Construção
            </h1>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              Estamos trabalhando para melhorar esta página. 
              <br />
              <span className="text-gray-700 font-medium">Em breve estará disponível!</span>
            </p>
          </div>
          
          <div className="space-y-4">
            {/* Indicador de progresso neutro */}
            <div className="flex items-center justify-center space-x-3 text-sm text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="font-medium">Desenvolvimento em andamento</span>
            </div>
            
            {/* Botões neutros */}
            <div className="space-y-3">
              <Button 
                onClick={() => navigate(-1)}
                className="w-full bg-gray-700 hover:bg-gray-800 text-white font-medium py-2 transition-colors duration-200"
              >
                ← Voltar
              </Button>
              
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 transition-colors duration-200"
              >
                🔄 Recarregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnderConstruction; 