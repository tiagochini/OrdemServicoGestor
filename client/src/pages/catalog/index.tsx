import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Tag, Package, Settings, Eye, Edit, Grid, List } from 'lucide-react';
import { Link } from 'wouter';
import { CatalogItem } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CatalogItemForm from '@/components/catalog/catalog-item-form';

const formatCurrency = (value: string | number) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
};

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const { toast } = useToast();

  const {
    data: catalogItems = [],
    isLoading,
    error,
    refetch
  } = useQuery<CatalogItem[]>({
    queryKey: ['/api/catalog'],
    queryFn: async () => {
      const response = await fetch('/api/catalog');
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

  // Filtrar itens baseado nos critérios selecionados
  const filteredItems = catalogItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    
    const matchesTags = selectedTags.length === 0 || 
      (item.tags && selectedTags.some(tag => item.tags!.includes(tag)));
    
    return matchesSearch && matchesType && matchesTags;
  });

  // Extrair todas as tags únicas dos itens
  const allTags = Array.from(new Set(
    catalogItems
      .flatMap(item => item.tags || [])
      .filter(Boolean)
  ));

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Catálogo de Produtos e Serviços</h1>
        <Button onClick={() => setIsFormModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Item
        </Button>
      </div>
      
      {/* Filtros e Busca */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
        <div className="relative lg:w-1/3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, descrição ou SKU..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="lg:w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="product">Produtos</SelectItem>
            <SelectItem value="service">Serviços</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Tags de Filtro */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-muted-foreground">Filtrar por tags:</span>
          {allTags.slice(0, 10).map((tag) => (
            <Badge 
              key={tag} 
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
          {allTags.length > 10 && (
            <Badge variant="outline" className="cursor-pointer">
              <Filter className="h-3 w-3 mr-1" />
              Mais filtros
            </Badge>
          )}
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total de Itens</span>
            </div>
            <p className="text-2xl font-bold">{catalogItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Produtos</span>
            </div>
            <p className="text-2xl font-bold">
              {catalogItems.filter(item => item.type === 'product').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Serviços</span>
            </div>
            <p className="text-2xl font-bold">
              {catalogItems.filter(item => item.type === 'service').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Listagem dos Itens */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Carregando catálogo...</p>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum item encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedTags.length > 0 || typeFilter !== 'all'
              ? "Tente ajustar os filtros para encontrar mais itens."
              : "Comece adicionando produtos e serviços ao catálogo."}
          </p>
          {!(searchTerm || selectedTags.length > 0 || typeFilter !== 'all') && (
            <Button onClick={() => setIsFormModalOpen(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro Item
            </Button>
          )}
        </div>
      ) : (
        <CatalogGrid items={filteredItems} viewMode={viewMode} />
      )}

      {/* Modal do Formulário */}
      <CatalogItemForm
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

function CatalogGrid({ items, viewMode }: { items: CatalogItem[]; viewMode: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Badge variant={item.type === 'product' ? 'default' : 'secondary'}>
                        {item.type === 'product' ? 'Produto' : 'Serviço'}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/catalog/${item.id}`}>
                        <h3 className="text-lg font-semibold hover:text-blue-600 cursor-pointer truncate">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {item.description || 'Sem descrição'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>SKU: {item.sku || 'N/A'}</span>
                    <span>Unidade: {item.unit}</span>
                    <span>Preço: {formatCurrency(item.price)}</span>
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/catalog/${item.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/catalog/edit/${item.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant={item.type === 'product' ? 'default' : 'secondary'}>
                {item.type === 'product' ? 'Produto' : 'Serviço'}
              </Badge>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/catalog/${item.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/catalog/edit/${item.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <CardTitle className="text-lg">
              <Link to={`/catalog/${item.id}`} className="hover:text-blue-600">
                {item.name}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description || 'Sem descrição disponível'}
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Preço:</span>
                <span className="font-semibold">{formatCurrency(item.price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Unidade:</span>
                <span>{item.unit}</span>
              </div>
              {item.sku && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SKU:</span>
                  <span className="font-mono text-xs">{item.sku}</span>
                </div>
              )}
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {item.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{item.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}