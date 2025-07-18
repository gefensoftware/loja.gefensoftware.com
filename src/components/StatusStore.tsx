'use client'

export function StatusStore({ isOpen }: { isOpen: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
      isOpen 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
      {isOpen ? 'Aberto' : 'Fechado'}
    </span>
  );
}