import { useState, useEffect, useCallback } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import {
  Plus,
  Upload,
  Download,
  FileText,
  Search,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PerdCompTable from "@/components/perdcomps/PerdCompTable";
import PerdCompForm from "@/components/perdcomps/PerdCompForm";
import PerdCompDetail from "@/components/perdcomps/PerdCompDetail";
import {
  usePerdCompStore,
  type PerdComp,
  type PerDcompStatus,
} from "@/stores/perdcompStore";
import { useClientStore } from "@/stores/clientStore";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function PerdCompsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingPerdComp, setEditingPerdComp] = useState<PerdComp | null>(null);
  const [preSelectedClientId, setPreSelectedClientId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [searchedClients, setSearchedClients] = useState<any[]>([]);
  const [isSearchingClients, setIsSearchingClients] = useState(false);

  const {
    perdcomps,
    statistics,
    fetchPerdComps,
    isLoading,
    currentPage,
    totalPages,
    setCurrentPage,
    setFilters,
    selectedPerdComp: storePerdComp,
  } = usePerdCompStore();
  const { clients, fetchClients } = useClientStore();
  const { toast } = useToast();

  // Debounced client search effect
  const debouncedClientSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return async (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (query.trim()) {
            setIsSearchingClients(true);
            try {
              // Use the clientStore's searchClients method
              const { searchClients } = useClientStore.getState();
              await searchClients(query.trim());

              // Get the searched results from the store
              const { clients } = useClientStore.getState();
              setSearchedClients(clients);
            } catch (error) {
              console.error("Error searching clients:", error);
              setSearchedClients([]);
            } finally {
              setIsSearchingClients(false);
            }
          } else {
            setSearchedClients([]);
            setIsSearchingClients(false);
          }
        }, 300);
      };
    })(),
    []
  );

  // Debounced search effect
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setFilters({ search: query.trim() || undefined });
        }, 300);
      };
    })(),
    [setFilters]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    debouncedClientSearch(clientSearchQuery);
  }, [clientSearchQuery, debouncedClientSearch]);

  useEffect(() => {
    if (id) {
      // If there's an ID in the route, open the detail view
      setIsDetailOpen(true);
    } else {
      // Check if we received a client CNPJ to filter by
      const clientCnpj = location.state?.clientCnpj;
      if (clientCnpj && !searchQuery) {
        setSearchQuery(clientCnpj);
        // The debouncedSearch will trigger and filter by this CNPJ
      } else if (!searchQuery) {
        fetchPerdComps(currentPage);
      }

      // Check if we need to open the form with a pre-selected client
      const newWithClient = searchParams.get("newWithClient");
      if (newWithClient) {
        setPreSelectedClientId(newWithClient);
        setIsFormOpen(true);
        // Clear the search param after handling it
        setSearchParams({});
      }
    }
    fetchClients();
  }, [currentPage, id, searchParams, fetchPerdComps, fetchClients]);

  const handleEdit = (perdcomp: PerdComp) => {
    setEditingPerdComp(perdcomp);
    setIsFormOpen(true);
  };

  const handleView = (perdcomp: PerdComp) => {
    navigate(`/perdcomps/${perdcomp.id}`);
  };

  const handleAdd = () => {
    setEditingPerdComp(null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingPerdComp(null);
    setPreSelectedClientId(null);
    fetchPerdComps();
    // If we have an ID in the route (detail view is open), navigate back to main page
    if (id) {
      navigate("/perdcomps");
    }
  };

  // Use searched clients if search query exists, otherwise show recent clients
  const displayClients = clientSearchQuery.trim()
    ? searchedClients
    : clients.slice(0, 10); // Show only first 10 clients when no search

  const selectedClient =
    displayClients.find((client) => client.id.toString() === filterClient) ||
    clients.find((client) => client.id.toString() === filterClient);

  // Handle client filter change - use backend search
  const handleClientSelect = (clientId: string) => {
    setFilterClient(clientId);
    setClientSearchOpen(false);
    setClientSearchQuery("");
    setSearchedClients([]); // Clear search results

    // Apply filter via backend search
    if (clientId === "all") {
      // Clear search, fetch all
      setSearchQuery("");
      fetchPerdComps(1, "");
    } else {
      // Find client CNPJ and search by it
      const selectedClient =
        displayClients.find((c) => c.id === clientId) ||
        clients.find((c) => c.id === clientId);
      if (selectedClient) {
        setSearchQuery(selectedClient.cnpj);
        fetchPerdComps(1, selectedClient.cnpj);
      }
    }
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

  const handleStatusFilterChange = (status: string) => {
    setFilterStatus(status);
    setFilters({
      status: status === "all" ? undefined : (status as PerDcompStatus),
    });
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg dark:from-primary/80 dark:to-primary/60">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent dark:bg-gradient-to-r dark:from-primary dark:to-primary/70">
                  PER/DCOMPs
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gerencie pedidos de restituição e compensação
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
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Importar</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="gap-2 text-xs sm:text-sm"
                size="sm"
              >
                <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Exportar</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button
                onClick={handleAdd}
                className="bg-gradient-to-r from-primary to-primary/80 gap-2 text-xs sm:text-sm"
                size="sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Novo PER/DCOMP</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-4 sm:mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4 bg-card/50 backdrop-blur border-primary/10">
              <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              <p className="text-lg sm:text-2xl font-bold">
                {statistics.total}
              </p>
            </Card>
            <Card className="p-3 sm:p-4 bg-card/50 backdrop-blur border-primary/10">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Pendentes
              </p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                {statistics.pendentes}
              </p>
            </Card>
            <Card className="p-3 sm:p-4 bg-card/50 backdrop-blur border-primary/10">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Deferidos
              </p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">
                {statistics.deferidos}
              </p>
            </Card>
            <Card className="p-3 sm:p-4 bg-card/50 backdrop-blur border-primary/10">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Valor Total
              </p>
              <p className="text-sm sm:text-2xl font-bold truncate">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(parseFloat(statistics.valor_total || "0"))}
              </p>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-6">
          <Card className="p-3 sm:p-4 bg-card/50 backdrop-blur border-border/50">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por número, imposto ou competência..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              <Select
                value={filterStatus}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                  <SelectItem value="TRANSMITIDO">Transmitido</SelectItem>
                  <SelectItem value="EM_PROCESSAMENTO">
                    Em Processamento
                  </SelectItem>
                  <SelectItem value="DEFERIDO">Deferido</SelectItem>
                  <SelectItem value="INDEFERIDO">Indeferido</SelectItem>
                  <SelectItem value="PARCIALMENTE_DEFERIDO">
                    Parcialmente Deferido
                  </SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  <SelectItem value="VENCIDO">Vencido</SelectItem>
                </SelectContent>
              </Select>
              <Popover
                open={clientSearchOpen}
                onOpenChange={setClientSearchOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientSearchOpen}
                    className="w-full sm:w-[250px] justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate text-sm">
                        {selectedClient
                          ? selectedClient.nome_fantasia ||
                            selectedClient.razao_social
                          : "Buscar cliente..."}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[90vw] sm:w-[400px] p-0 z-50 bg-popover border shadow-md">
                  <Command>
                    <CommandInput
                      placeholder="Buscar por CNPJ, nome fantasia ou razão social..."
                      value={clientSearchQuery}
                      onValueChange={setClientSearchQuery}
                    />
                    <CommandList className="max-h-[300px]">
                      {isSearchingClients ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="ml-2 text-sm text-muted-foreground">
                            Buscando...
                          </span>
                        </div>
                      ) : (
                        <>
                          {displayClients.length === 0 &&
                          clientSearchQuery.trim() ? (
                            <CommandEmpty>
                              Nenhum cliente encontrado.
                            </CommandEmpty>
                          ) : (
                            <CommandGroup>
                              <CommandItem
                                key="all"
                                value="all"
                                onSelect={() => handleClientSelect("all")}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    filterClient === "all"
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                Todos os clientes
                              </CommandItem>
                              {displayClients.map((client) => {
                                const displayName =
                                  client.nome_fantasia ||
                                  client.razao_social ||
                                  "Cliente sem nome";
                                const searchText = `${client.cnpj} ${
                                  client.nome_fantasia || ""
                                } ${client.razao_social || ""}`;

                                return (
                                  <CommandItem
                                    key={client.id}
                                    value={searchText}
                                    onSelect={() =>
                                      handleClientSelect(client.id.toString())
                                    }
                                    className="cursor-pointer py-3 px-2"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 shrink-0 ${
                                        filterClient === client.id.toString()
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }`}
                                    />
                                    <div className="flex flex-col items-start min-w-0 flex-1 gap-1">
                                      <span className="text-sm font-medium leading-tight break-words">
                                        {displayName}
                                      </span>
                                      <span className="text-xs text-muted-foreground leading-tight">
                                        CNPJ: {client.cnpj}
                                      </span>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          )}
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card className="bg-card/50 backdrop-blur overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <PerdCompTable
              perdcomps={perdcomps}
              onEdit={handleEdit}
              onView={handleView}
            />
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 sm:mt-6">
            <Pagination>
              <PaginationContent className="flex justify-center">
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

                {/* Mobile: Show only current page and total */}
                <div className="sm:hidden flex items-center px-2">
                  <span className="text-xs text-muted-foreground">
                    {currentPage} de {totalPages}
                  </span>
                </div>

                {/* Desktop: Show pagination links */}
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
      </div>

      {/* Form Dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setPreSelectedClientId(null);
            setEditingPerdComp(null);
            // If we have an ID in the route (detail view was open), navigate back to main page
            if (id) {
              navigate("/perdcomps");
            }
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingPerdComp ? "Editar PER/DCOMP" : "Novo PER/DCOMP"}
            </DialogTitle>
          </DialogHeader>
          <PerdCompForm
            perdcomp={editingPerdComp}
            clientId={preSelectedClientId || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsFormOpen(false);
              setPreSelectedClientId(null);
              setEditingPerdComp(null);
              // If we have an ID in the route (detail view was open), navigate back to main page
              if (id) {
                navigate("/perdcomps");
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open && id) {
            navigate("/perdcomps");
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="sr-only">Detalhes do PER/DCOMP</DialogTitle>
          </DialogHeader>
          {id && (
            <PerdCompDetail
              perdcompId={id}
              onEdit={() => {
                // Use the perdcomp from the store that was loaded by PerdCompDetail
                setEditingPerdComp(storePerdComp);
                setIsDetailOpen(false);
                setIsFormOpen(true);
              }}
              onBack={() => {
                setIsDetailOpen(false);
                if (id) {
                  navigate("/perdcomps");
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
