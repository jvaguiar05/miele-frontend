import React, { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface RequestFilters {
  action: 'all' | 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'custom';
  status: 'all' | 'pending' | 'approved' | 'rejected' | 'executed' | 'cancelled';
  resource_type: 'all' | 'clients' | 'perdcomps' | 'custom';
  search: string;
}

interface RequestFiltersProps {
  onFiltersChange?: (filters: RequestFilters) => void;
}

export default function RequestFilters({ onFiltersChange }: RequestFiltersProps) {
  const [filters, setFilters] = useState<RequestFilters>({
    action: 'all',
    status: 'all',
    resource_type: 'all',
    search: ''
  });

  // Notify parent when filters change
  React.useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  const handleSearch = (query: string) => {
    const newFilters = { ...filters, search: query };
    setFilters(newFilters);
  };

  const handleActionChange = (action: string) => {
    const newFilters = { ...filters, action: action as RequestFilters['action'] };
    setFilters(newFilters);
  };

  const handleStatusChange = (status: string) => {
    const newFilters = { ...filters, status: status as RequestFilters['status'] };
    setFilters(newFilters);
  };

  const handleResourceTypeChange = (resource_type: string) => {
    const newFilters = { ...filters, resource_type: resource_type as RequestFilters['resource_type'] };
    setFilters(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      action: 'all' as const,
      status: 'all' as const,
      resource_type: 'all' as const,
      search: ''
    };
    setFilters(clearedFilters);
  };

  const activeFiltersCount = [
    filters.action !== 'all' ? 1 : 0,
    filters.status !== 'all' ? 1 : 0,
    filters.resource_type !== 'all' ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar solicitações..."
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Action Filter */}
        <Select value={filters.action} onValueChange={handleActionChange}>
          <SelectTrigger className="w-auto min-w-[130px]">
            <SelectValue placeholder="Todas as Ações" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Ações</SelectItem>
            <SelectItem value="create">Criar</SelectItem>
            <SelectItem value="update">Atualizar</SelectItem>
            <SelectItem value="delete">Excluir</SelectItem>
            <SelectItem value="activate">Ativar</SelectItem>
            <SelectItem value="deactivate">Desativar</SelectItem>
            <SelectItem value="custom">Personalizada</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-auto min-w-[130px]">
            <SelectValue placeholder="Todos os Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
            <SelectItem value="executed">Executado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        {/* Resource Type Filter */}
        <Select value={filters.resource_type} onValueChange={handleResourceTypeChange}>
          <SelectTrigger className="w-auto min-w-[130px]">
            <SelectValue placeholder="Todos os Tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="clients">Clientes</SelectItem>
            <SelectItem value="perdcomps">PER/DCOMP</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Button with Badge */}
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
            <Filter className="h-3 w-3" />
            {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}
          </Badge>
        )}

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={clearFilters} size="sm" className="text-muted-foreground hover:text-foreground">
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
