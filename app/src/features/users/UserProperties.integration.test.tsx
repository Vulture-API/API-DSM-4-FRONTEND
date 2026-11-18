import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { defaultRoutes, mockApi, renderWithProviders, testUser } from "@/test/utils";
import { properties, users } from "@/test/fixtures";
import { UserFormModal } from "./UserFormModal";
import { UsersPage } from "./UsersPage";

const admin = { ...testUser, role_name: "Administrador", property_ids: null };
describe("SCRUM-616: integração dos vínculos", () => {
  it("consulta, remove vínculos e os exibe ao reabrir o usuário", async () => {
    let linked = [properties[0]!];
    const api = mockApi({ ...defaultRoutes(),
      "GET /api/users/2/properties": () => linked,
      "PUT /api/users/2": users[1],
      "PUT /api/users/2/properties": ({body}: {body: unknown}) => {
        linked = properties.filter(p => (body as {property_ids:number[]}).property_ids.includes(p.id));
        return linked;
      },
    });
    const close=vi.fn();
    const first=renderWithProviders(<UserFormModal user={users[1]} onClose={close} />,admin);
    await waitFor(()=>expect(screen.getByLabelText(properties[0]!.name)).toBeChecked());
    await userEvent.click(screen.getByLabelText(properties[0]!.name));
    await userEvent.click(screen.getByRole("button",{name:"Salvar"}));
    await waitFor(()=>expect(close).toHaveBeenCalledOnce());
    expect(api.calls.find(c=>c.method==="PUT"&&c.path.endsWith("/properties"))?.body).toEqual({property_ids:[]});
    first.unmount();
    renderWithProviders(<UserFormModal user={users[1]} onClose={vi.fn()} />,admin);
    await waitFor(()=>expect(screen.getByLabelText(properties[0]!.name)).not.toBeChecked());
  });
  it("repete somente o vínculo se o usuário foi criado antes da falha", async () => {
    let failures=1;
    const created={...users[1]!,id:55};
    const api=mockApi({...defaultRoutes(),
      "POST /api/users":created,
      "GET /api/users/55/properties":[],
      "PUT /api/users/55/properties":()=> failures-- >0 ? {status:500,body:{message:"Falha temporária"}} : [properties[0]],
    });
    const close=vi.fn();
    renderWithProviders(<UserFormModal onClose={close}/>,admin);
    fireEvent.change(screen.getByLabelText("Nome completo"),{target:{value:"Novo cliente"}});
    fireEvent.change(screen.getByLabelText("E-mail"),{target:{value:"novo@test.dev"}});
    fireEvent.change(screen.getByLabelText("Senha"),{target:{value:"password123"}});
    await waitFor(()=>expect(screen.getByRole("option",{name:"Cliente"})).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Cargo"),{target:{value:"2"}});
    await userEvent.click(await screen.findByLabelText(properties[0]!.name));
    await userEvent.click(screen.getByRole("button",{name:"Cadastrar"}));
    await screen.findByText(/Falha temporária/);
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByLabelText("E-mail")).toBeDisabled();
    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("E-mail"), "ignorado@review.test");
    expect(screen.getByLabelText("E-mail")).toHaveValue("novo@test.dev");
    await waitFor(()=>expect(screen.getByRole("button",{name:"Cadastrar"})).toBeEnabled());
    await userEvent.click(screen.getByRole("button",{name:"Cadastrar"}));
    await waitFor(()=>expect(close).toHaveBeenCalledOnce());
    expect(api.calls.filter(c=>c.method==="POST")).toHaveLength(1);
    expect(api.calls.filter(c=>c.method==="PUT"&&c.path.endsWith("/properties"))).toHaveLength(2);
    expect(api.calls.filter(c=>c.method==="PUT"&&!c.path.endsWith("/properties"))).toHaveLength(0);
  });
  it("não consulta vínculos sem perfil Administrador e oculta escrita do Cliente", async () => {
    const api=mockApi(defaultRoutes());
    renderWithProviders(<UsersPage/>,{...testUser,role_name:"Cliente",property_ids:[2]});
    await screen.findByText(users[0]!.name);
    expect(screen.queryByRole("button",{name:"Novo usuário"})).not.toBeInTheDocument();
    expect(screen.queryByRole("button",{name:/Editar usuário/})).not.toBeInTheDocument();
    expect(api.calls.some(c=>c.path.endsWith("/properties"))).toBe(false);
  });
});
