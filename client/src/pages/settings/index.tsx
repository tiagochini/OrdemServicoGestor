import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Save, 
  Moon, 
  Sun, 
  Mail, 
  Smartphone, 
  User, 
  Shield, 
  Store, 
  Cog
} from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  
  const handleSaveGeneral = () => {
    toast({
      title: "Configurações salvas",
      description: "As configurações gerais foram salvas com sucesso.",
    });
  };
  
  const handleSaveNotifications = () => {
    toast({
      title: "Notificações configuradas",
      description: "Suas preferências de notificação foram atualizadas.",
    });
  };

  return (
    <div className="py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex-1 min-w-0 mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Configurações
          </h2>
        </div>
        
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general" className="flex items-center">
              <Cog className="h-4 w-4 mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center">
              <Store className="h-4 w-4 mr-2" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Segurança
            </TabsTrigger>
          </TabsList>
          
          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Gerencie as configurações gerais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Aparência</h3>
                  <Separator />
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="flex flex-row space-x-4 items-center">
                      {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Modo Escuro</p>
                        <p className="text-sm text-muted-foreground">
                          Ative o modo escuro para reduzir o cansaço visual
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Informações Pessoais</h3>
                  <Separator />
                  <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Nome
                      </Label>
                      <Input id="name" value="Administrador" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">
                        Usuário
                      </Label>
                      <Input id="username" value="admin" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input id="email" value="admin@example.com" className="col-span-3" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Idioma e Região</h3>
                  <Separator />
                  <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="language" className="text-right">
                        Idioma
                      </Label>
                      <div className="col-span-3">
                        <select 
                          id="language" 
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="pt-BR">Português (Brasil)</option>
                          <option value="en-US">English (US)</option>
                          <option value="es">Español</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="timezone" className="text-right">
                        Fuso Horário
                      </Label>
                      <div className="col-span-3">
                        <select 
                          id="timezone" 
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                          <option value="America/New_York">Eastern Time (GMT-5)</option>
                          <option value="Europe/London">London (GMT+0)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="currency" className="text-right">
                        Moeda
                      </Label>
                      <div className="col-span-3">
                        <select 
                          id="currency" 
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="BRL">Real Brasileiro (R$)</option>
                          <option value="USD">US Dollar ($)</option>
                          <option value="EUR">Euro (€)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleSaveGeneral}
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Gerencie como e quando você recebe notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Canais de Notificação</h3>
                  <Separator />
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="flex flex-row space-x-4 items-center">
                      <Mail className="h-5 w-5" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Notificações por Email</p>
                        <p className="text-sm text-muted-foreground">
                          Receba atualizações de ordens de serviço por email
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4 mt-2">
                    <div className="flex flex-row space-x-4 items-center">
                      <Smartphone className="h-5 w-5" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Notificações por SMS</p>
                        <p className="text-sm text-muted-foreground">
                          Receba alertas importantes por mensagem de texto
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={smsNotifications}
                      onCheckedChange={setSmsNotifications}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Tipos de Notificação</h3>
                  <Separator />
                  <div className="grid gap-4 py-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="new-order" className="rounded border-gray-300" defaultChecked />
                      <Label htmlFor="new-order">Nova ordem de serviço</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="status-change" className="rounded border-gray-300" defaultChecked />
                      <Label htmlFor="status-change">Mudança de status em uma ordem</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="order-assigned" className="rounded border-gray-300" defaultChecked />
                      <Label htmlFor="order-assigned">Ordem atribuída a um técnico</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="order-completed" className="rounded border-gray-300" defaultChecked />
                      <Label htmlFor="order-completed">Ordem concluída</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="order-canceled" className="rounded border-gray-300" defaultChecked />
                      <Label htmlFor="order-canceled">Ordem cancelada</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleSaveNotifications}
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Preferências
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Company Settings */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>
                  Gerencie os dados da sua empresa que aparecerão nas ordens de serviço
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Dados da Empresa</h3>
                  <Separator />
                  <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="company-name" className="text-right">
                        Nome da Empresa
                      </Label>
                      <Input id="company-name" placeholder="TechService LTDA" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="company-cnpj" className="text-right">
                        CNPJ
                      </Label>
                      <Input id="company-cnpj" placeholder="00.000.000/0000-00" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="company-address" className="text-right">
                        Endereço
                      </Label>
                      <Input id="company-address" placeholder="Rua Exemplo, 123" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="company-phone" className="text-right">
                        Telefone
                      </Label>
                      <Input id="company-phone" placeholder="(00) 0000-0000" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="company-email" className="text-right">
                        Email
                      </Label>
                      <Input id="company-email" placeholder="contato@techservice.com.br" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="company-website" className="text-right">
                        Website
                      </Label>
                      <Input id="company-website" placeholder="www.techservice.com.br" className="col-span-3" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Configurações de Ordem de Serviço</h3>
                  <Separator />
                  <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="order-prefix" className="text-right">
                        Prefixo do Número
                      </Label>
                      <Input id="order-prefix" placeholder="OS-" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="order-terms" className="text-right">
                        Termos e Condições
                      </Label>
                      <textarea
                        id="order-terms"
                        placeholder="Termos e condições padrão para ordens de serviço..."
                        className="col-span-3 min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Informações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>
                  Gerencie as configurações de segurança da sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Alteração de Senha</h3>
                  <Separator />
                  <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="current-password" className="text-right">
                        Senha Atual
                      </Label>
                      <Input id="current-password" type="password" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-password" className="text-right">
                        Nova Senha
                      </Label>
                      <Input id="new-password" type="password" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="confirm-password" className="text-right">
                        Confirmar Senha
                      </Label>
                      <Input id="confirm-password" type="password" className="col-span-3" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Segurança da Conta</h3>
                  <Separator />
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="flex flex-row space-x-4 items-center">
                      <User className="h-5 w-5" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Verificação em Duas Etapas</p>
                        <p className="text-sm text-muted-foreground">
                          Adicione uma camada extra de segurança à sua conta
                        </p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="mt-4">
                    <Button variant="outline" className="w-full">
                      Verificar Atividades Recentes
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Sessões Ativas</h3>
                  <Separator />
                  <div className="rounded-lg border p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-sm font-medium">Este Dispositivo</p>
                        <p className="text-xs text-gray-500">Windows • Chrome • São Paulo, Brasil</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Ativo</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">iPhone 13</p>
                        <p className="text-xs text-gray-500">iOS • Safari • São Paulo, Brasil</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-xs">Encerrar</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
