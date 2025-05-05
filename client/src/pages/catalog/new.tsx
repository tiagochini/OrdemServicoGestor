import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function NewCatalogItemPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirecionar para a página de formulário de novo item
    setLocation('/catalog/edit/new');
  }, [setLocation]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
