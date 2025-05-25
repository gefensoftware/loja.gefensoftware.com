import React, { useEffect, useState } from 'react';
import { Category } from '../types';
import { api } from '../api';
import { useParams } from 'react-router-dom';
import { Card } from './ui/card';
import { X } from 'lucide-react';

interface CategorySidebarProps {
  onCategorySelect: (categoryId: string | null) => void;
  selectedCategory: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  onCategorySelect,
  selectedCategory,
  isOpen,
  onClose,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const { id_enterprise } = useParams();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get(`/category/enterprise/${id_enterprise}`);
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [id_enterprise]);

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
            {categories.map((category) => (
              <button
                key={category.id_category}
                onClick={() => {
                  onCategorySelect(category.id_category);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedCategory === category.id_category
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