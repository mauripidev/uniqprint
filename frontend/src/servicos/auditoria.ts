import { requisicaoApi } from "./api.js";
import { FiltrosAuditoria, RespostaListagemAuditoria, RegistroAuditoria } from "../tipos/auditoria.js";

export async function listarAuditoria(
  filtros: FiltrosAuditoria = {}
): Promise<RespostaListagemAuditoria> {
  const parametros = new URLSearchParams();

  if (filtros.pagina) parametros.append("pagina", filtros.pagina.toString());
  if (filtros.limite) parametros.append("limite", filtros.limite.toString());
  if (filtros.data_inicio) parametros.append("data_inicio", filtros.data_inicio);
  if (filtros.data_fim) parametros.append("data_fim", filtros.data_fim);
  if (filtros.usuario_id) parametros.append("usuario_id", filtros.usuario_id.toString());
  if (filtros.acao) parametros.append("acao", filtros.acao);
  if (filtros.entidade) parametros.append("entidade", filtros.entidade);

  const query = parametros.toString() ? `?${parametros.toString()}` : "";
  return requisicaoApi<RespostaListagemAuditoria>(`/auditoria${query}`);
}

export async function buscarAuditoriaPorId(id: number): Promise<{ dados: RegistroAuditoria }> {
  return requisicaoApi<{ dados: RegistroAuditoria }>(`/auditoria/${id}`);
}

export const servicoAuditoria = {
  listarAuditoria,
  buscarAuditoriaPorId
};
