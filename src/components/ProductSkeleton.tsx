'use client'

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const ProductSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden border-border">
      {/* Mesmo desenho do ProductCard: texto à esquerda, foto quadrada à direita. */}
      <CardContent className="p-0">
        <div className="flex flex-row gap-4 p-4 sm:p-5">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="h-5 bg-muted rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded animate-pulse"></div>
              <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
            </div>
            <div className="space-y-1 pt-2">
              <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
              <div className="h-6 bg-muted rounded w-24 animate-pulse"></div>
            </div>
          </div>
          <div className="shrink-0 w-28 sm:w-32 aspect-square bg-muted rounded-lg animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ProductSkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
}; 