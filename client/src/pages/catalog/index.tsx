import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Tag } from 'lucide-react';
import { Link } from 'wouter';
import { CatalogItem } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (value: string | number) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
};

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const { toast } = useToast();

  const {
    data: catalogItems = [],
    isLoading,
    error,
    refetch
  } = useQuery<CatalogItem[]>({
    queryKey: ['/api/catalog', activeType],
    queryFn: async () => {
      const url = activeType 
        ? `/api/catalog?type=${activeType}` 
        : '/api/catalog';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Falha ao carregar itens do catálogo');
      }
      return response.json();
    }
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar itens do catálogo. Tente novamente.',
        variant: 'destructive'
      });
    }
  }, [error, toast]);

  // Filtrar por tags e termo de busca
  const filteredItems = catalogItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTags = activeTags.length === 0 || 
      (item.tags && activeTags.some(tag => item.tags.includes(tag)));
    
    return matchesSearch && matchesTags;
  });

  // Extrair todas as tags únicas dos itens
  const allTags = Array.from(new Set(
    catalogItems
      .flatMap(item => item.tags || [])
      .filter(Boolean)
  ));

  const toggleTag = (tag: string) => {
    setActiveTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Catálogo</h1>
        <Button asChild>
          <Link to="/catalog/new">
            <Plus className="mr-2 h-4 w-4" /> Novo Item
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <div className="relative md:w-1/3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, descrição ou SKU..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
          {allTags.slice(0, 8).map((tag) => (
            <Badge 
              key={tag} 
              variant={activeTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
          {allTags.length > 8 && (
            <Button variant="ghost" size="sm" className="px-2">
              <Filter className="h-4 w-4 mr-1" />
              Mais filtros
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setActiveType(value === 'all' ? null : value)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="product">Produtos</TabsTrigger>
          <TabsTrigger value="service">Serviços</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <CatalogGrid items={filteredItems} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="product" className="mt-0">
          <CatalogGrid 
            items={filteredItems.filter(item => item.type === 'product')} 
            isLoading={isLoading} 
          />
        </TabsContent>
        
        <TabsContent value="service" className="mt-0">
          <CatalogGrid 
            items={filteredItems.filter(item => item.type === 'service')} 
            isLoading={isLoading} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CatalogGrid({ items, isLoading }: { items: CatalogItem[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200 dark:bg-gray-800" />
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Tag className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">Nenhum item encontrado</h3>
        <p className="text-muted-foreground mt-2">
          Tente ajustar seus filtros ou adicione um novo item ao catálogo.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <Link key={item.id} to={`/catalog/${item.id}`}>
          <Card className="overflow-hidden h-full cursor-pointer transition-all hover:shadow-md">
            <div className="h-48 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center">
              <div className="text-2xl font-semibold text-center p-4">
                {item.type === 'product' ? '📦' : '🔧'} {item.name}
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-start">
                <span>{item.name}</span>
                <Badge variant={item.type === 'product' ? 'default' : 'secondary'}>
                  {item.type === 'product' ? 'Produto' : 'Serviço'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-muted-foreground text-sm line-clamp-2">
                {item.description || 'Sem descrição'}
              </p>
              {item.sku && (
                <p className="text-xs text-muted-foreground mt-1">
                  SKU: {item.sku}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-lg font-bold">
                {formatCurrency(item.price)}
              </div>
              <div className="flex flex-wrap gap-1 justify-end">
                {item.tags?.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {item.tags && item.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">+{item.tags.length - 2}</Badge>
                )}
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}
