import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ProvedorAutenticacao } from "../contextos/ContextoAutenticacao.js";
import { LayoutPrincipal } from "../layouts/LayoutPrincipal.js";
import { TelaLogin } from "../paginas/autenticacao/TelaLogin.js";
import { TelaDashboard } from "../paginas/dashboard/TelaDashboard.js";
import { TelaProdutos } from "../paginas/produtos/TelaProdutos.js";
import { TelaFornecedores } from "../paginas/fornecedores/TelaFornecedores.js";
import { TelaClientes } from "../paginas/clientes/TelaClientes.js";
import { RotaProtegida } from "./RotaProtegida.js";

export const AppRotas: React.FC = () => {
  return (
    <BrowserRouter>
      <ProvedorAutenticacao>
        <Routes>
          {/* Rota pública de login */}
          <Route path="/login" element={<TelaLogin />} />

          {/* Rotas protegidas */}
          <Route
            path="/"
            element={
              <RotaProtegida>
                <LayoutPrincipal />
              </RotaProtegida>
            }
          >
            <Route index element={<TelaDashboard />} />
            <Route path="produtos" element={<TelaProdutos />} />
            <Route path="fornecedores" element={<TelaFornecedores />} />
            <Route path="clientes" element={<TelaClientes />} />
          </Route>



          {/* Rota padrão fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProvedorAutenticacao>
    </BrowserRouter>
  );
};
