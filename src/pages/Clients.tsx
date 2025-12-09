import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Search, Plus, Filter, Download, Upload, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClientStore, type Client } from "@/stores/clientStore";
import { useToast } from "@/hooks/use-toast";
import ClientTable from "@/components/clients/ClientTable";
import ClientForm from "@/components/clients/ClientForm";
import ClientDetail from "@/components/clients/ClientDetail";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Remove the local Client interface since we use the one from clientStore

interface ClientFilters {
  tipo_empresa?: string;
  recuperacao_judicial?: boolean;
  uf?: string;
  regime_tributacao?: string;
}

export default function Clients() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    fetchClients,
    fetchClientById,
    isLoading,
    error,
    searchClients,
    currentPage,
    totalPages,
    setCurrentPage,
    filters,
    setFilters,
    clearFilters,
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
    [searchClients, fetchClients]
  );

  useEffect(() => {
    if (id) {
      // Fetch the client data when URL parameter is present
      const loadClientFromUrl = async () => {
        try {
          const client = await fetchClientById(id);
          setSelectedClient(client);
          setIsDetailOpen(true);
        } catch (error) {
          console.error("Failed to load client from URL:", error);
          navigate("/clients"); // Navigate back if client not found
        }
      };
      loadClientFromUrl();
    }
  }, [id, fetchClientById, navigate]);

  // Initial load - only run once when component mounts
  useEffect(() => {
    if (!id) {
      fetchClients(1, "", {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle page changes
  useEffect(() => {
    if (!id && currentPage > 1) {
      fetchClients(currentPage, searchQuery, filters);
    }
  }, [currentPage]);

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
    setSelectedClient(client);
    setIsDetailOpen(true);
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
    return Object.values(filters).filter(
      (value) => value !== undefined && value !== null && value !== ""
    ).length;
  };

  const handleExportExcel = () => {
    toast({
      title: "Exportando dados",
      description: "O arquivo Excel será baixado em breve.",
    });
  };

  const handleImportExcel = () => {
    toast({
      title: "Importar Excel",
      description: "Funcionalidade em desenvolvimento.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 sm:mb-6 md:mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg dark:from-primary/80 dark:to-primary/60">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                {/* make the text blue like the icon, but with gradient */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent dark:bg-gradient-to-r dark:from-primary dark:to-primary/70">
                  Clientes
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gerencie seus clientes e informações
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={handleImportExcel}
                variant="outline"
                className="gap-2 text-xs sm:text-sm"
                size="sm"
              >
                <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Importar</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="gap-2 text-xs sm:text-sm"
                size="sm"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Exportar</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button
                onClick={() => {
                  setSelectedClient(null);
                  setIsFormOpen(true);
                }}
                className="bg-gradient-to-r from-primary to-primary/80 gap-2 text-xs sm:text-sm"
                size="sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Novo Cliente</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 sm:mb-6"
        >
          <Card className="p-3 sm:p-4 border-border/50 bg-card/50 backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou razão social..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="relative w-full sm:w-auto"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="text-sm">Filtros</span>
                    {getActiveFiltersCount() > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[90vw] sm:w-80 p-4" align="end">
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
                        <label className="text-sm font-medium">
                          Tipo de Empresa
                        </label>
                        <Select
                          value={localFilters.tipo_empresa || "all"}
                          onValueChange={(value) =>
                            setLocalFilters((prev) => ({
                              ...prev,
                              tipo_empresa: value === "all" ? undefined : value,
                            }))
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
                            setLocalFilters((prev) => ({
                              ...prev,
                              uf: value === "all" ? undefined : value,
                            }))
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
                            <SelectItem value="RS">
                              Rio Grande do Sul
                            </SelectItem>
                            <SelectItem value="PR">Paraná</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Regime Tributário
                        </label>
                        <Select
                          value={localFilters.regime_tributacao || "all"}
                          onValueChange={(value) =>
                            setLocalFilters((prev) => ({
                              ...prev,
                              regime_tributacao:
                                value === "all" ? undefined : value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o regime" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="Simples Nacional">
                              Simples Nacional
                            </SelectItem>
                            <SelectItem value="Lucro Presumido">
                              Lucro Presumido
                            </SelectItem>
                            <SelectItem value="Lucro Real">
                              Lucro Real
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Recuperação Judicial
                        </label>
                        <Select
                          value={
                            localFilters.recuperacao_judicial === undefined
                              ? "all"
                              : localFilters.recuperacao_judicial.toString()
                          }
                          onValueChange={(value) =>
                            setLocalFilters((prev) => ({
                              ...prev,
                              recuperacao_judicial:
                                value === "all" ? undefined : value === "true",
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

                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                      <Button
                        onClick={handleApplyFilters}
                        className="flex-1 text-sm"
                      >
                        Aplicar Filtros
                      </Button>
                      <Button
                        onClick={handleClearFilters}
                        variant="outline"
                        className="text-sm"
                      >
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
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Tipo: {filters.tipo_empresa}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        setFilters({ ...filters, tipo_empresa: undefined })
                      }
                    />
                  </Badge>
                )}
                {filters.uf && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    UF: {filters.uf}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, uf: undefined })}
                    />
                  </Badge>
                )}
                {filters.regime_tributacao && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Regime: {filters.regime_tributacao}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        setFilters({ ...filters, regime_tributacao: undefined })
                      }
                    />
                  </Badge>
                )}
                {filters.recuperacao_judicial !== undefined && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Recuperação: {filters.recuperacao_judicial ? "Sim" : "Não"}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        setFilters({
                          ...filters,
                          recuperacao_judicial: undefined,
                        })
                      }
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
              <ClientTable onEdit={handleEdit} onView={handleView} />
            )}
          </Card>
        </motion.div>

        {/* Pagination - Mobile Optimized */}
        {totalPages > 1 && (
          <div className="mt-4 sm:mt-6">
            <Pagination>
              <PaginationContent className="flex-wrap justify-center gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`text-xs sm:text-sm ${
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }`}
                  />
                </PaginationItem>

                {/* Mobile: Show fewer pages */}
                <div className="flex sm:hidden">
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => handlePageChange(1)}
                        className="cursor-pointer text-xs"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {currentPage > 2 && <span className="px-1 text-xs">...</span>}

                  <PaginationItem>
                    <PaginationLink
                      isActive={true}
                      className="cursor-pointer text-xs"
                    >
                      {currentPage}
                    </PaginationLink>
                  </PaginationItem>

                  {currentPage < totalPages - 1 && (
                    <span className="px-1 text-xs">...</span>
                  )}

                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => handlePageChange(totalPages)}
                        className="cursor-pointer text-xs"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                </div>

                {/* Desktop: Show full pagination */}
                <div className="hidden sm:flex">
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
                            className="cursor-pointer text-sm"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-1 text-sm">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={`text-xs sm:text-sm ${
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Client Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="w-[95vw] sm:max-w-3xl h-[90vh] sm:max-h-[85vh] p-0 gap-0">
            <DialogHeader className="p-4 sm:p-6 pb-0">
              <DialogTitle className="text-base sm:text-lg">
                {selectedClient ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto h-full p-4 sm:p-6 pt-4">
              <ClientForm
                client={selectedClient}
                onSuccess={() => {
                  setIsFormOpen(false);
                  fetchClients(currentPage);
                }}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Client Detail Dialog */}
        <Dialog
          open={isDetailOpen}
          onOpenChange={(open) => {
            setIsDetailOpen(open);
            if (!open && id) {
              navigate("/clients");
            }
          }}
        >
          <DialogContent className="w-[95vw] sm:max-w-4xl h-[90vh] sm:max-h-[85vh] p-0 gap-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Detalhes do Cliente</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto h-full p-4 sm:p-6">
              {selectedClient ? (
                <ClientDetail
                  clientId={selectedClient.id}
                  client={selectedClient as any}
                  onEdit={() => handleEdit(selectedClient)}
                  onBack={() => setIsDetailOpen(false)}
                  onAddPerdComp={() => {
                    navigate(`/perdcomps?newWithClient=${selectedClient.id}`);
                    setIsDetailOpen(false);
                  }}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Carregando dados do cliente...
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
