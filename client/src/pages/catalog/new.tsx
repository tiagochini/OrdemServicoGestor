import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import CatalogItemForm from '@/components/catalog/catalog-item-form';
import { useState } from 'react';

export default function NewCatalogItemPage() {
  const [isFormOpen, setIsFormOpen] = useState(true);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link to="/catalog">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Novo Item do Catálogo
        </h1>
      </div>

      <CatalogItemForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          // Redirecionar para o catálogo após sucesso
          window.location.href = '/catalog';
        }}
      />
    </div>
  );
}