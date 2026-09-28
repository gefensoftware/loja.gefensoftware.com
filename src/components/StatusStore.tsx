'use client'

export function StatusStore({ isOpen }: { isOpen: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
      isOpen 
        ? 'bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-200' 
        : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
    }`}>
      <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
      {isOpen ? 'Aberto' : 'Fechado'}
    </span>
  );
}