import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ChangePassword() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: Omit<ChangePasswordForm, 'confirmPassword'>) => {
      const token = localStorage.getItem('authToken');
      return apiRequest('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setSuccess('Password changed successfully');
      setError('');
      
      // Update user info to reflect password change
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.mustChangePassword = false;
      localStorage.setItem('user', JSON.stringify(user));
      
      setTimeout(() => {
        setLocation('/dashboard');
      }, 2000);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to change password');
      setSuccess('');
    },
  });

  const onSubmit = (data: ChangePasswordForm) => {
    setError('');
    setSuccess('');
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Alterar Senha
          </CardTitle>
          <CardDescription className="text-center">
            É necessário alterar sua senha antes de continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert>
                  <AlertDescription className="text-green-600">{success}</AlertDescription>
                </Alert>
              )}
              
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Atual</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="Digite sua senha atual"
                          className="pl-10"
                          disabled={changePasswordMutation.isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="Digite sua nova senha"
                          className="pl-10"
                          disabled={changePasswordMutation.isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="Confirme sua nova senha"
                          className="pl-10"
                          disabled={changePasswordMutation.isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}