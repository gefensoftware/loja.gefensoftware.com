import {  ShoppingBag, Coffee, Utensils } from "lucide-react";

interface LoadingScreenProps {
  enterpriseName?: string;
}

const LoadingScreen = ({ enterpriseName }: LoadingScreenProps) => {
  const icons = [ShoppingBag, Coffee, Utensils];
  const randomIcon = icons[Math.floor(Math.random() * icons.length)];
  const IconComponent = randomIcon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Logo/Icon Animation */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto mb-4 relative">
            {/* Pulsing background circle */}
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            <div className="absolute inset-2 bg-primary/10 rounded-full animate-pulse"></div>
            
            {/* Main icon container */}
            <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center shadow-lg border border-primary/20">
              <IconComponent className="w-8 h-8 text-primary animate-bounce" />
            </div>
          </div>
          
          {/* Orbiting dots */}
          {/* <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative w-32 h-32">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-primary rounded-full animate-spin"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${i * 120}deg) translateY(-16px)`,
                    animation: `spin 2s linear infinite`,
                    animationDelay: `${i * 0.3}s`
                  }}
                />
              ))}
            </div>
          </div> */}
        </div>

        {/* Loading text */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground animate-pulse">
            {enterpriseName ? enterpriseName : "Carregando..."}
          </h2>
          
          <div className="flex items-center justify-center space-x-2">
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
            <span className="text-muted-foreground text-sm ml-2">
              Preparando seu catálogo
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-64 mx-auto">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse" 
                 style={{
                   animation: 'progress 2s ease-in-out infinite'
                 }} />
          </div>
        </div>

      
      </div>
    </div>
  );
};

export default LoadingScreen; 