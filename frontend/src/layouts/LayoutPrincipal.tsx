import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Package, Printer, ShoppingBag, ShoppingCart, Truck, Users } from "lucide-react";
import { usarAutenticacao } from "../contextos/ContextoAutenticacao.js";

export const LayoutPrincipal: React.FC = () => {
  const { usuario, logout } = usarAutenticacao();
  const navigate = useNavigate();

  const lidarComLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="layout-principal">
      <header className="barra-topo">
        <div className="lado-esquerdo-topo">
          <Link to="/" className="marca-app">
            <div className="icone-marca">
              <Printer size={20} />
            </div>
            <span className="nome-marca">Uniqprint</span>
          </Link>

          <nav className="menu-navegacao-topo">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `item-menu-topo ${isActive ? "ativo" : ""}`
              }
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/vendas"
              className={({ isActive }) =>
                `item-menu-topo ${isActive ? "ativo" : ""}`
              }
              data-testid="link-menu-vendas"
            >
              <ShoppingBag size={16} />
              <span>Vendas</span>
            </NavLink>

            <NavLink
              to="/compras"
              className={({ isActive }) =>
                `item-menu-topo ${isActive ? "ativo" : ""}`
              }
              data-testid="link-menu-compras"
            >
              <ShoppingCart size={16} />
              <span>Compras</span>
            </NavLink>

            <NavLink
              to="/produtos"
              className={({ isActive }) =>
                `item-menu-topo ${isActive ? "ativo" : ""}`
              }
              data-testid="link-menu-produtos"
            >
              <Package size={16} />
              <span>Produtos</span>
            </NavLink>

            <NavLink
              to="/fornecedores"
              className={({ isActive }) =>
                `item-menu-topo ${isActive ? "ativo" : ""}`
              }
              data-testid="link-menu-fornecedores"
            >
              <Truck size={16} />
              <span>Fornecedores</span>
            </NavLink>

            <NavLink
              to="/clientes"
              className={({ isActive }) =>
                `item-menu-topo ${isActive ? "ativo" : ""}`
              }
              data-testid="link-menu-clientes"
            >
              <Users size={16} />
              <span>Clientes</span>
            </NavLink>
          </nav>
        </div>



        <div className="perfil-topo">
          <div className="usuario-info">
            <span className="usuario-nome" data-testid="nome-usuario-logado">
              {usuario?.nome}
            </span>
            <span className="usuario-papel">{usuario?.papel}</span>
          </div>

          <button
            onClick={lidarComLogout}
            className="botao-sair"
            title="Sair do sistema"
            data-testid="botao-logout"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </header>

      <main className="conteudo-principal">
        <Outlet />
      </main>
    </div>
  );
};
