import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Search, Plus, Filter, Download, Upload, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClientStore } from "@/stores/clientStore";
import { useToast } from "@/hooks/use-toast";
import ClientTable from "@/components/clients/ClientTable";
import ClientForm from "@/components/clients/ClientForm";
import ClientDetail from "@/components/clients/ClientDetail";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Client {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  tipo_empresa: string;
  email_contato?: string;
  telefone_contato?: string;
  recuperacao_judicial?: boolean;
}

interface ClientFilters {
  tipo_empresa?: string;
  recuperacao_judicial?: boolean;
  uf?: string;
  regime_tributario?: string;
}

export default function Clients() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    fetchClients, 
    isLoading, 
    error, 
    searchClients,
    currentPage,
    totalPages,
    setCurrentPage,
    filters,
    setFilters,
    clearFilters
  } = useClientStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [localFilters, setLocalFilters] = useState<ClientFilters>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debounced search
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (query.trim()) {
            searchClients(query, filters);
          } else {
            fetchClients(1, query, filters);
          }
        }, 300);
      };
    })(),
    [searchClients, fetchClients, filters]
  );

  useEffect(() => {
    if (id) {
      setSelectedClient({ id } as Client);
      setIsDetailOpen(true);
    } else {
      fetchClients(currentPage, searchQuery, filters);
    }
  }, [currentPage, id, filters]);

  useEffect(() => {
    if (searchQuery !== undefined) {
      debouncedSearch(searchQuery);
    }
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleApplyFilters = () => {
    setFilters(localFilters);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    clearFilters();
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleView = (client: Client) => {
    navigate(`/clients/${client.id}`);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Clientes</h1>
                <p className="text-muted-foreground">Gerencie seus clientes e informações</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => {
                  setSelectedClient(null);
                  setIsFormOpen(true);
                }}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <Card className="p-4 border-border/50 bg-card/50 backdrop-blur">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou razão social..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    {getActiveFiltersCount() > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Filtros</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFilterOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Tipo de Empresa</label>
                        <Select
                          value={localFilters.tipo_empresa || "all"}
                          onValueChange={(value) =>
                            setLocalFilters(prev => ({ ...prev, tipo_empresa: value === "all" ? undefined : value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="LTDA">LTDA</SelectItem>
                            <SelectItem value="SA">S/A</SelectItem>
                            <SelectItem value="MEI">MEI</SelectItem>
                            <SelectItem value="EIRELI">EIRELI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">UF</label>
                        <Select
                          value={localFilters.uf || "all"}
                          onValueChange={(value) =>
                            setLocalFilters(prev => ({ ...prev, uf: value === "all" ? undefined : value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="SP">São Paulo</SelectItem>
                            <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                            <SelectItem value="MG">Minas Gerais</SelectItem>
                            <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                            <SelectItem value="PR">Paraná</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Regime Tributário</label>
                        <Select
                          value={localFilters.regime_tributario || "all"}
                          onValueChange={(value) =>
                            setLocalFilters(prev => ({ ...prev, regime_tributario: value === "all" ? undefined : value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o regime" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                            <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                            <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Recuperação Judicial</label>
                        <Select
                          value={localFilters.recuperacao_judicial === undefined ? "all" : localFilters.recuperacao_judicial.toString()}
                          onValueChange={(value) =>
                            setLocalFilters(prev => ({ 
                              ...prev, 
                              recuperacao_judicial: value === "all" ? undefined : value === "true"
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="true">Sim</SelectItem>
                            <SelectItem value="false">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleApplyFilters} className="flex-1">
                        Aplicar Filtros
                      </Button>
                      <Button onClick={handleClearFilters} variant="outline">
                        Limpar
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Active Filters Display */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {filters.tipo_empresa && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Tipo: {filters.tipo_empresa}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({...filters, tipo_empresa: undefined})}
                    />
                  </Badge>
                )}
                {filters.uf && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    UF: {filters.uf}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({...filters, uf: undefined})}
                    />
                  </Badge>
                )}
                {filters.regime_tributario && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Regime: {filters.regime_tributario}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({...filters, regime_tributario: undefined})}
                    />
                  </Badge>
                )}
                {filters.recuperacao_judicial !== undefined && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Recuperação: {filters.recuperacao_judicial ? 'Sim' : 'Não'}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({...filters, recuperacao_judicial: undefined})}
                    />
                  </Badge>
                )}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Clients Table with scroll */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ClientTable
                onEdit={handleEdit}
                onView={handleView}
              />
            )}
          </Card>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return <span key={page} className="px-1">...</span>;
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Client Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedClient ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <ClientForm
              client={selectedClient}
              onSuccess={() => {
                setIsFormOpen(false);
                fetchClients(currentPage);
              }}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Client Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open && id) {
            navigate('/clients');
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedClient && (
              <ClientDetail
                clientId={selectedClient.id}
                onEdit={(client) => {
                  setSelectedClient(client);
                  setIsDetailOpen(false);
                  setIsFormOpen(true);
                }}
                onBack={() => setIsDetailOpen(false)}
                onAddPerdComp={() => {
                  navigate(`/perdcomps?newWithClient=${selectedClient.id}`);
                  setIsDetailOpen(false);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}