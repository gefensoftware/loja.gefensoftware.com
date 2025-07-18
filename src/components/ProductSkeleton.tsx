'use client'

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const ProductSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden border-gray-200">
      <CardContent className="p-0">
        <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
        <div className="p-4 space-y-3">
          <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ProductSkeletonGrid: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
}; 