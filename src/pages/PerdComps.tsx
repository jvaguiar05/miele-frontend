import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
import { usePerdCompStore, type PerdComp } from "@/stores/perdcompStore";
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

  const {
    perdcomps,
    fetchPerdComps,
    searchPerdComps,
    isLoading,
    currentPage,
    totalPages,
    setCurrentPage,
    selectedPerdComp: storePerdComp,
  } = usePerdCompStore();
  const { clients, fetchClients } = useClientStore();
  const { toast } = useToast();

  // Debounced search effect
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (query.trim()) {
            searchPerdComps(query);
          } else {
            fetchPerdComps(currentPage);
          }
        }, 300);
      };
    })(),
    [searchPerdComps, fetchPerdComps, currentPage]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    if (id) {
      // If there's an ID in the route, open the detail view
      setIsDetailOpen(true);
    } else {
      if (!searchQuery) {
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
  }, [currentPage, id, searchParams]);

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

  const filteredClients = clients.filter(
    (client) =>
      clientSearchQuery === "" ||
      client.nome_fantasia
        ?.toLowerCase()
        .includes(clientSearchQuery.toLowerCase()) ||
      client.razao_social
        ?.toLowerCase()
        .includes(clientSearchQuery.toLowerCase())
  );

  const selectedClient = clients.find(
    (client) => client.id.toString() === filterClient
  );

  // Handle client filter change - use backend search
  const handleClientSelect = (clientId: string) => {
    setFilterClient(clientId);
    setClientSearchOpen(false);
    setClientSearchQuery("");

    // Apply filter via backend search
    if (clientId === "all") {
      // Clear search, fetch all
      setSearchQuery("");
      fetchPerdComps(1, "");
    } else {
      // Find client CNPJ and search by it
      const selectedClient = clients.find((c) => c.id === clientId);
      if (selectedClient) {
        setSearchQuery(selectedClient.cnpj);
        searchPerdComps(selectedClient.cnpj);
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

  // Apply status filter client-side (can be moved to backend later)
  const filteredPerdComps = perdcomps.filter((pc) => {
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "approved" && pc.status === "DEFERIDO") ||
      (filterStatus === "pending" &&
        (pc.status === "RASCUNHO" ||
          pc.status === "TRANSMITIDO" ||
          pc.status === "EM_PROCESSAMENTO")) ||
      (filterStatus === "rejected" && pc.status === "INDEFERIDO");

    return matchesStatus;
  });

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-full p-4 md:p-8 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                PER/DCOMPs
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie pedidos de restituição e compensação
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleImportExcel}
              variant="outline"
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Importar
            </Button>
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-primary to-primary/80 gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo PER/DCOMP
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-card/50 backdrop-blur border-primary/10">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{perdcomps.length}</p>
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur border-primary/10">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">
              {
                perdcomps.filter(
                  (p) =>
                    p.status === "RASCUNHO" ||
                    p.status === "TRANSMITIDO" ||
                    p.status === "EM_PROCESSAMENTO"
                ).length
              }
            </p>
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur border-primary/10">
            <p className="text-sm text-muted-foreground">Deferidos</p>
            <p className="text-2xl font-bold text-green-600">
              {
                perdcomps.filter(
                  (p) =>
                    p.status === "DEFERIDO" ||
                    p.status === "PARCIALMENTE_DEFERIDO"
                ).length
              }
            </p>
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur border-primary/10">
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(
                perdcomps.reduce(
                  (acc, p) => acc + parseFloat(p.valor_pedido || "0"),
                  0
                )
              )}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-card/50 backdrop-blur">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por número, imposto ou competência..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="received">Recebidos</SelectItem>
              </SelectContent>
            </Select>
            <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={clientSearchOpen}
                  className="w-full md:w-[250px] justify-between"
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
              <PopoverContent className="w-[300px] max-w-[90vw] p-0 z-50 bg-popover border shadow-md">
                <Command>
                  <CommandInput
                    placeholder="Buscar cliente..."
                    value={clientSearchQuery}
                    onValueChange={setClientSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        key="all"
                        value="all"
                        onSelect={() => handleClientSelect("all")}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            filterClient === "all" ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        Todos os clientes
                      </CommandItem>
                      {filteredClients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={
                            client.nome_fantasia || client.razao_social || ""
                          }
                          onSelect={() =>
                            handleClientSelect(client.id.toString())
                          }
                          className="cursor-pointer"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 shrink-0 ${
                              filterClient === client.id.toString()
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          <span className="truncate text-sm">
                            {client.nome_fantasia || client.razao_social}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </Card>

        {/* Table */}
        <Card className="bg-card/50 backdrop-blur overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <PerdCompTable
              perdcomps={filteredPerdComps}
              onEdit={handleEdit}
              onView={handleView}
            />
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
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
                    return (
                      <span key={page} className="px-1">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
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
        <DialogContent className="max-w-2xl">
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
