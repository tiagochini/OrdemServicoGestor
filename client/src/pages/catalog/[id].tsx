import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Edit, Loader2, Tag, Clipboard, DollarSign, Package, Timer, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CatalogItem } from '@shared/schema';

const formatCurrency = (value: string | number) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
};

const getUnitLabel = (unit: string) => {
  switch(unit) {
    case 'unit': return 'Unidade';
    case 'kg': return 'Quilograma';
    case 'l': return 'Litro';
    case 'm': return 'Metro';
    case 'm2': return 'Metro quadrado';
    case 'hour': return 'Hora';
    default: return unit;
  }
};

export default function CatalogItemDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

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
              Não foi possível encontrar o item solicitado. O item pode ter sido removido ou está indisponível.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            <Button asChild>
              <Link to="/catalog">Voltar para o catálogo</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link to="/catalog">
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {item.name}
          </h1>
        </div>
        <Button asChild>
          <Link to={`/catalog/edit/${id}`}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Badge variant={item.type === 'product' ? 'default' : 'secondary'} className="text-sm">
                  {item.type === 'product' ? 'Produto' : 'Serviço'}
                </Badge>
                {!item.isActive && (
                  <Badge variant="destructive" className="text-sm">
                    Inativo
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Descrição</h3>
                <p className="text-muted-foreground mt-1">
                  {item.description || 'Nenhuma descrição disponível para este item.'}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Preço</h3>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-emerald-500" />
                    <span className="text-xl font-bold">{formatCurrency(item.price)}</span>
                  </div>
                </div>

                {item.cost && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Custo</h3>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="text-xl font-bold">{formatCurrency(item.cost)}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Unidade</h3>
                  <div className="flex items-center">
                    {item.type === 'product' ? (
                      <Package className="h-5 w-5 mr-2 text-gray-500" />
                    ) : (
                      <Timer className="h-5 w-5 mr-2 text-gray-500" />
                    )}
                    <span>{getUnitLabel(item.unit)}</span>
                  </div>
                </div>

                {item.sku && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">SKU</h3>
                    <div className="flex items-center">
                      <Clipboard className="h-5 w-5 mr-2 text-gray-500" />
                      <span>{item.sku}</span>
                    </div>
                  </div>
                )}
              </div>

              {item.tags && item.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium">Informações adicionais</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Criado em</h4>
                <p>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Última atualização</h4>
                <p>{new Date(item.updatedAt).toLocaleDateString('pt-BR')}</p>
              </div>

              <Separator />

              {item.type === 'product' && (
                <div className="pt-2">
                  <Button variant="outline" className="w-full" onClick={() => setLocation('/work-orders/new')}>
                    Adicionar a um novo pedido
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}