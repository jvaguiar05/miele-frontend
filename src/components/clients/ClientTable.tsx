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
import { useClientStore } from "@/stores/clientStore";
import { Badge } from "@/components/ui/badge";

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
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>CNPJ</TableHead>
            <TableHead>Razão Social</TableHead>
            <TableHead>Nome Fantasia</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Nenhum cliente encontrado
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow 
                key={client.id} 
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => onView ? onView(client) : onEdit(client)}
              >
                <TableCell className="font-mono text-sm">
                  {formatCNPJ(client.cnpj)}
                </TableCell>
                <TableCell className="font-medium">{client.razao_social}</TableCell>
                <TableCell>{client.nome_fantasia || "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{client.tipo_empresa}</Badge>
                </TableCell>
                <TableCell>{client.email_contato || "-"}</TableCell>
                <TableCell>{client.telefone_contato || "-"}</TableCell>
                <TableCell>
                  <Badge 
                    variant={client.recuperacao_judicial ? "destructive" : "default"}
                    className="text-xs"
                  >
                    {client.recuperacao_judicial ? "Rec. Judicial" : "Ativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView ? onView(client) : onEdit(client)}>
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
  );
}