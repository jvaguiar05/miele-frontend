import { useState } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Shield, 
  Key, 
  LogOut, 
  Trash2, 
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Profile() {
  const { toast } = useToast();
  const { user, profile, signOut, updateProfile: updateAuthProfile, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  
  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isLoading, setIsLoading] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  
  // Confirmation states
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await updateAuthProfile({ full_name: fullName });
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "A nova senha e confirmação não coincidem.",
        variant: "destructive",
      });
      return;
    }
    setShowPasswordConfirmation(true);
  };

  const confirmPasswordChange = async () => {
    setIsPasswordLoading(true);
    setShowPasswordConfirmation(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      });
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({
        title: "Erro ao alterar senha",
        description: "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída permanentemente.",
      });
      
      await signOut();
      navigate("/login");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conta.",
        variant: "destructive",
      });
    }
  };

  const handleSetup2FA = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setQrCode("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/Miele:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Miele");
      setTwoFactorEnabled(true);
      
      toast({
        title: "2FA configurado",
        description: "Autenticação de dois fatores ativada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível configurar 2FA.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Perfil</h1>
            <p className="text-muted-foreground">
              Gerencie suas informações pessoais e configurações de segurança
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>
                  Atualize suas informações básicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isLoading || authLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar informações
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>
                  Mantenha sua conta segura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha atual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Digite sua senha atual"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite a nova senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme a nova senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <AlertDialog open={showPasswordConfirmation} onOpenChange={setShowPasswordConfirmation}>
                  <Button 
                    onClick={handleChangePassword}
                    disabled={isPasswordLoading || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full"
                  >
                    {isPasswordLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Alterar senha
                      </>
                    )}
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-amber-500" />
                        Confirmar alteração de senha
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Você está prestes a alterar sua senha. Esta ação irá desconectar você de todos os dispositivos. Tem certeza de que deseja continuar?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setShowPasswordConfirmation(false)}>
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={confirmPasswordChange} className="bg-primary hover:bg-primary/90">
                        Confirmar alteração
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>

          {/* Security Settings */}
          <div className="space-y-6">
            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Autenticação de Dois Fatores
                </CardTitle>
                <CardDescription>
                  Adicione uma camada extra de segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!twoFactorEnabled ? (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      A autenticação de dois fatores não está configurada
                    </p>
                    <Button onClick={handleSetup2FA} className="w-full">
                      <Shield className="h-4 w-4 mr-2" />
                      Configurar 2FA
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-green-600 mb-2">✓ 2FA ativado</p>
                      {qrCode && (
                        <div className="flex justify-center mb-4">
                          <img src={qrCode} alt="QR Code" className="border rounded" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="verificationCode">Código de verificação</Label>
                      <Input
                        id="verificationCode"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Digite o código do app"
                      />
                    </div>
                    <Button variant="outline" className="w-full">
                      Desativar 2FA
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações da Conta</CardTitle>
                <CardDescription>
                  Gerencie sua sessão e conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Fazer logout
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Zona de Perigo
                </CardTitle>
                <CardDescription>
                  Ações irreversíveis que afetarão permanentemente sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-destructive/20 bg-background p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-destructive/10">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-sm">Exclusão permanente da conta</h4>
                      <p className="text-sm text-muted-foreground">
                        Esta ação irá excluir permanentemente sua conta e todos os dados associados. 
                        Esta operação não pode ser desfeita.
                      </p>
                    </div>
                  </div>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full justify-start">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir conta permanentemente
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Excluir conta permanentemente
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>Esta ação é <strong>irreversível</strong> e irá:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Excluir permanentemente sua conta</li>
                          <li>Remover todos os seus dados</li>
                          <li>Cancelar assinaturas ativas</li>
                          <li>Revogar acesso a todos os serviços</li>
                        </ul>
                        <p className="pt-2 text-sm font-medium">
                          Para confirmar, digite <span className="font-mono bg-muted px-1 rounded">EXCLUIR CONTA</span> abaixo:
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                      <Input
                        placeholder="Digite EXCLUIR CONTA"
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmationText("")}>
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmationText !== "EXCLUIR CONTA"}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                      >
                        Confirmar exclusão
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}