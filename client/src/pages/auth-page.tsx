import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, registerSchema } from "@/lib/auth-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirecionar para a página inicial se já estiver autenticado
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Configuração do formulário de login
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  // Configuração do formulário de registro
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      email: "",
      role: "customer", // Valor padrão
      relatedId: null,
    },
  });

  // Função para submeter o formulário de login
  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  // Função para submeter o formulário de registro
  function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    registerMutation.mutate(values);
  }

  return (
    <div className="flex min-h-screen">
      {/* Seção esquerda - Formulário */}
      <div className="flex flex-col justify-center w-full max-w-md p-8">
        <h1 className="text-3xl font-bold mb-2">TuringOS</h1>
        <div className="w-32 h-16 mb-4 flex items-center justify-center bg-gray-100 rounded border border-dashed border-gray-300">
          <span className="text-gray-400 text-xs">Logo da empresa</span>
        </div>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Registro</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                  Entre com seu nome de usuário e senha para acessar o sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form 
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)} 
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usuário</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite seu usuário" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input 
                                type={showLoginPassword ? "text" : "password"} 
                                placeholder="Digite sua senha" 
                                {...field} 
                              />
                            </FormControl>
                            <button 
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                            >
                              {showLoginPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between">
                      <FormField
                        control={loginForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Manter conectado</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                        Esqueceu sua senha?
                      </a>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        "Entrar"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Cadastro</CardTitle>
                <CardDescription>
                  Crie uma nova conta para acessar o sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form 
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)} 
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite seu nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Digite seu email" 
                              {...field} 
                              value={field.value || ""} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome de Usuário</FormLabel>
                          <FormControl>
                            <Input placeholder="Crie um nome de usuário" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input 
                                type={showRegisterPassword ? "text" : "password"} 
                                placeholder="Crie uma senha" 
                                {...field} 
                              />
                            </FormControl>
                            <button 
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            >
                              {showRegisterPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Senha</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder="Confirme sua senha" 
                                {...field} 
                              />
                            </FormControl>
                            <button 
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        "Registrar"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Seção direita - Hero */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 text-white">
        <div className="flex flex-col justify-center max-w-md">
          <h2 className="text-4xl font-bold mb-6">Gerencie suas ordens de serviço</h2>
          <p className="text-lg mb-8">
            Uma plataforma completa para gerenciar técnicos, clientes e ordens de serviço. 
            Aumente a produtividade e melhore o atendimento ao cliente com nosso sistema.
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium">Gerencie equipes técnicas</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium">Acompanhe o status de serviços</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium">Cadastro organizado de clientes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
