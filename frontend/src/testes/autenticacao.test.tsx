import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ProvedorAutenticacao } from "../contextos/ContextoAutenticacao.js";
import { TelaLogin } from "../paginas/autenticacao/TelaLogin.js";
import * as servicoAutenticacao from "../servicos/autenticacao.js";
import { ErroRequisicaoApi } from "../servicos/api.js";

// Mock do serviço de autenticação
vi.mock("../servicos/autenticacao.js", () => ({
  obterUsuarioAutenticado: vi.fn(),
  realizarLogin: vi.fn(),
  realizarLogout: vi.fn()
}));

const renderizarComProvedor = (componente: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <ProvedorAutenticacao>{componente}</ProvedorAutenticacao>
    </BrowserRouter>
  );
};

describe("Tela de Login (Front-end)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Por padrão, sem usuário logado
    vi.mocked(servicoAutenticacao.obterUsuarioAutenticado).mockRejectedValue(
      new Error("Não autenticado")
    );
  });

  it("deve renderizar os campos de e-mail, senha e botão de login", async () => {
    renderizarComProvedor(<TelaLogin />);

    expect(await screen.findByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByTestId("botao-entrar")).toBeInTheDocument();
  });

  it("deve exibir mensagens de validação ao enviar formulário vazio", async () => {
    renderizarComProvedor(<TelaLogin />);

    const botaoEntrar = await screen.findByTestId("botao-entrar");
    fireEvent.click(botaoEntrar);

    expect(await screen.findByText(/o e-mail é obrigatório/i)).toBeInTheDocument();
    expect(screen.getByText(/a senha é obrigatória/i)).toBeInTheDocument();
  });

  it("deve validar formato inválido de e-mail", async () => {
    renderizarComProvedor(<TelaLogin />);

    const inputEmail = await screen.findByLabelText(/e-mail/i);
    const botaoEntrar = screen.getByTestId("botao-entrar");

    fireEvent.change(inputEmail, { target: { value: "email-invalido" } });
    fireEvent.click(botaoEntrar);

    expect(await screen.findByText(/informe um e-mail válido/i)).toBeInTheDocument();
  });

  it("deve realizar login com sucesso ao fornecer credenciais válidas", async () => {
    vi.mocked(servicoAutenticacao.realizarLogin).mockResolvedValueOnce({
      id: 1,
      email: "admin@uniqprint.com.br",
      nome: "Administrador Uniqprint",
      papel: "ADMINISTRADOR",
      ativo: true,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      ultimo_login_em: null
    });

    renderizarComProvedor(<TelaLogin />);

    const inputEmail = await screen.findByLabelText(/e-mail/i);
    const inputSenha = screen.getByLabelText(/senha/i);
    const botaoEntrar = screen.getByTestId("botao-entrar");

    fireEvent.change(inputEmail, { target: { value: "admin@uniqprint.com.br" } });
    fireEvent.change(inputSenha, { target: { value: "admin123" } });
    fireEvent.click(botaoEntrar);

    await waitFor(() => {
      expect(servicoAutenticacao.realizarLogin).toHaveBeenCalledWith({
        email: "admin@uniqprint.com.br",
        senha: "admin123"
      });
    });
  });

  it("deve exibir banner de erro ao receber erro da API", async () => {
    vi.mocked(servicoAutenticacao.realizarLogin).mockRejectedValueOnce(
      new ErroRequisicaoApi("E-mail ou senha incorretos", "CREDENCIAS_INVALIDAS", 401)
    );

    renderizarComProvedor(<TelaLogin />);

    const inputEmail = await screen.findByLabelText(/e-mail/i);
    const inputSenha = screen.getByLabelText(/senha/i);
    const botaoEntrar = screen.getByTestId("botao-entrar");

    fireEvent.change(inputEmail, { target: { value: "admin@uniqprint.com.br" } });
    fireEvent.change(inputSenha, { target: { value: "senhaErrada" } });
    fireEvent.click(botaoEntrar);

    expect(await screen.findByTestId("alerta-erro")).toHaveTextContent(
      "E-mail ou senha incorretos"
    );
  });
});
