'use client'

import React from 'react';
import type { Category } from '@/types/catalog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

interface CategorySidebarProps {
  // As categorias vêm de quem já as buscou (a grade). Antes esta barra
  // repetia `GET /enterprises/by-slug/{slug}/categories` a cada carregamento,
  // em estado próprio, e as duas listas podiam divergir.
  categories: Category[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onCategorySelect: (categoryId: string | null) => void;
  selectedCategory: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  loading,
  error,
  onRetry,
  onCategorySelect,
  selectedCategory,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Card className="h-full w-72 p-4 bg-background rounded-none border-r">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Categorias</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-primary/10 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => {
                onCategorySelect(null);
                onClose();
              }}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                selectedCategory === null
                  ? 'bg-primary text-white'
                  : 'text-foreground hover:bg-primary/10'
              }`}
            >
              Todos os produtos
            </button>

            {loading && (
              <div className="space-y-2 pt-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-9 bg-gray-200 rounded-md animate-pulse" />
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="pt-2 space-y-2">
                <div className="flex items-start gap-2 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Não foi possível carregar as categorias.</span>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={onRetry}>
                  Tentar novamente
                </Button>
              </div>
            )}

            {!loading && !error && categories.length === 0 && (
              <p className="pt-2 text-sm text-muted-foreground">
                Esta loja ainda não tem categorias.
              </p>
            )}

            {!loading && !error && categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  onCategorySelect(category.id);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'text-foreground hover:bg-primary/10'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
};
