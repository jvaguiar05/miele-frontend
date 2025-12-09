import { Edit, Trash2, Eye, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { usePerdCompStore, type PerdComp } from "@/stores/perdcompStore";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PerdCompTableProps {
  perdcomps: PerdComp[];
  onEdit: (perdcomp: PerdComp) => void;
  onView: (perdcomp: PerdComp) => void;
}

export default function PerdCompTable({
  perdcomps,
  onEdit,
  onView,
}: PerdCompTableProps) {
  const { deletePerdComp } = usePerdCompStore();

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este PER/DCOMP?")) {
      await deletePerdComp(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DEFERIDO":
      case "PARCIALMENTE_DEFERIDO":
        return "default";
      case "INDEFERIDO":
      case "CANCELADO":
        return "destructive";
      case "EM_PROCESSAMENTO":
        return "secondary";
      case "VENCIDO":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "RASCUNHO":
        return "Rascunho";
      case "TRANSMITIDO":
        return "Transmitido";
      case "EM_PROCESSAMENTO":
        return "Em Processamento";
      case "DEFERIDO":
        return "Deferido";
      case "INDEFERIDO":
        return "Indeferido";
      case "PARCIALMENTE_DEFERIDO":
        return "Parcialmente Deferido";
      case "CANCELADO":
        return "Cancelado";
      case "VENCIDO":
        return "Vencido";
      default:
        return status;
    }
  };

  const ActionDropdown = ({ perdcomp }: { perdcomp: PerdComp }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onView(perdcomp);
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onEdit(perdcomp);
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(perdcomp.id);
          }}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (perdcomps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum PER/DCOMP encontrado</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile Cards */}
      <div className="block sm:hidden space-y-3 p-3">
        {perdcomps.map((perdcomp) => (
          <Card
            key={perdcomp.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onView(perdcomp)}
          >
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-mono text-sm font-medium">
                    {perdcomp.numero}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {perdcomp.client_name || perdcomp.cnpj || "-"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={getStatusColor(perdcomp.status)}
                    className="text-xs"
                  >
                    {getStatusLabel(perdcomp.status)}
                  </Badge>
                  <ActionDropdown perdcomp={perdcomp} />
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Tributo:</span>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {perdcomp.tributo_pedido}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Competência:</span>
                  <p className="font-medium mt-1">{perdcomp.competencia}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor Pedido:</span>
                  <p className="font-medium mt-1 text-green-600">
                    {formatCurrency(parseFloat(perdcomp.valor_pedido || "0"))}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor Recebido:</span>
                  <p className="font-medium mt-1">
                    {formatCurrency(parseFloat(perdcomp.valor_recebido || "0"))}
                  </p>
                </div>
              </div>

              {/* Footer */}
              {perdcomp.data_transmissao && (
                <div className="pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    Transmitido em: {formatDate(perdcomp.data_transmissao)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tributo</TableHead>
              <TableHead>Competência</TableHead>
              <TableHead>Valor Pedido</TableHead>
              <TableHead>Valor Recebido</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Transmissão</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {perdcomps.map((perdcomp) => (
              <TableRow
                key={perdcomp.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => onView(perdcomp)}
              >
                <TableCell className="font-mono text-sm">
                  {perdcomp.numero}
                </TableCell>
                <TableCell className="font-medium">
                  {perdcomp.client_name || perdcomp.cnpj || "-"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{perdcomp.tributo_pedido}</Badge>
                </TableCell>
                <TableCell>{perdcomp.competencia}</TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(parseFloat(perdcomp.valor_pedido || "0"))}
                </TableCell>
                <TableCell>
                  {formatCurrency(parseFloat(perdcomp.valor_recebido || "0"))}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(perdcomp.status)}>
                    {getStatusLabel(perdcomp.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {perdcomp.data_transmissao
                    ? formatDate(perdcomp.data_transmissao)
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <ActionDropdown perdcomp={perdcomp} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
