import {
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Building2,
  Phone,
  Mail,
} from "lucide-react";
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
import { useClientStore, type Client } from "@/stores/clientStore";
import { Badge } from "@/components/ui/badge";

interface ClientTableProps {
  onEdit: (client: Client) => void;
  onView?: (client: Client) => void;
}

export default function ClientTable({ onEdit, onView }: ClientTableProps) {
  const { clients, deleteClient } = useClientStore();

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      await deleteClient(id);
    }
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  };

  return (
    <div className="w-full">
      {/* Mobile Cards View */}
      <div className="block sm:hidden space-y-3 p-3">
        {clients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Nenhum cliente encontrado</p>
          </div>
        ) : (
          clients.map((client) => (
            <Card
              key={client.id}
              className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => (onView ? onView(client) : onEdit(client))}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {client.razao_social}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatCNPJ(client.cnpj)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Badge
                      variant={
                        client.recuperacao_judicial ? "destructive" : "default"
                      }
                      className="text-xs"
                    >
                      {client.recuperacao_judicial ? "Rec. Judicial" : "Ativo"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onView ? onView(client) : onEdit(client);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(client);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(client.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-2">
                  {client.nome_fantasia && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">
                        {client.nome_fantasia}
                      </span>
                    </div>
                  )}

                  {client.email_contato && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">
                        {client.email_contato}
                      </span>
                    </div>
                  )}

                  {client.telefone_contato && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {client.telefone_contato}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                    <Badge variant="outline" className="text-xs">
                      {client.tipo_empresa}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs sm:text-sm">CNPJ</TableHead>
              <TableHead className="text-xs sm:text-sm">Razão Social</TableHead>
              <TableHead className="text-xs sm:text-sm">
                Nome Fantasia
              </TableHead>
              <TableHead className="text-xs sm:text-sm">Tipo</TableHead>
              <TableHead className="text-xs sm:text-sm">Email</TableHead>
              <TableHead className="text-xs sm:text-sm">Telefone</TableHead>
              <TableHead className="text-xs sm:text-sm">Status</TableHead>
              <TableHead className="text-right text-xs sm:text-sm">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Nenhum cliente encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow
                  key={client.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => (onView ? onView(client) : onEdit(client))}
                >
                  <TableCell className="font-mono text-xs sm:text-sm">
                    {formatCNPJ(client.cnpj)}
                  </TableCell>
                  <TableCell className="font-medium text-xs sm:text-sm">
                    {client.razao_social}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    {client.nome_fantasia || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {client.tipo_empresa}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    {client.email_contato || "-"}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    {client.telefone_contato || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        client.recuperacao_judicial ? "destructive" : "default"
                      }
                      className="text-xs"
                    >
                      {client.recuperacao_judicial ? "Rec. Judicial" : "Ativo"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            onView ? onView(client) : onEdit(client)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(client)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(client.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
