import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { CatalogItem } from '@shared/schema';
import CatalogItemForm from '@/components/catalog/catalog-item-form';
import { useState } from 'react';

export default function EditCatalogItemPage() {
  const { id } = useParams<{ id: string }>();
  const [isFormOpen, setIsFormOpen] = useState(true);

  const {
    data: item,
    isLoading,
    error
  } = useQuery<CatalogItem>({
    queryKey: ['/api/catalog', id],
    queryFn: async () => {
      const response = await fetch(`/api/catalog/${id}`);
      if (!response.ok) {
        throw new Error('Falha ao carregar dados do item');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-center pb-2">
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <h2 className="text-xl font-semibold text-center mb-2">Item não encontrado</h2>
            <p className="text-center text-muted-foreground">
              Não foi possível encontrar o item solicitado para edição.
            </p>
            <div className="flex justify-center mt-4">
              <Button asChild>
                <Link to="/catalog">Voltar para o catálogo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link to={`/catalog/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Editar Item: {item.name}
        </h1>
      </div>

      <CatalogItemForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        catalogItemId={parseInt(id!)}
        onSuccess={() => {
          // Redirecionar para a página de detalhes após sucesso
          window.location.href = `/catalog/${id}`;
        }}
      />
    </div>
  );
}