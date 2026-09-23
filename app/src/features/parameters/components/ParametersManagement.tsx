"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { SearchInput } from "@/components/ui/SearchInput/SearchInput";
import { FeedbackState } from "@/components/ui/FeedbackState/FeedbackState";
import { SidePanel } from "@/components/ui/SidePanel/SidePanel";
import { Modal } from "@/components/ui/Modal/Modal";
import { useParameters } from "../hooks/useParameters";
import type { ParameterRepository } from "../repositories/ParameterRepository";
import type { Parameter } from "../types/parameter";
import { ParameterForm } from "./ParameterForm";
import { ParametersTable } from "./ParametersTable";
import styles from "./ParametersManagement.module.css";

export function ParametersManagement({
  repository,
}: {
  repository?: ParameterRepository;
}) {
  const data = useParameters(repository);
  const heading = useRef<HTMLHeadingElement>(null);
  const [term, setTerm] = useState("");
  const [editor, setEditor] = useState<{ parameter?: Parameter } | null>(null);
  const [removing, setRemoving] = useState<Parameter | null>(null);
  const [notice, setNotice] = useState("");
  const [removeError, setRemoveError] = useState("");
  const query = term.trim().toLocaleLowerCase("pt-BR");
  const filtered = data.items.filter((item) =>
    [item.nome, item.unidade_medida].some((value) =>
      value.toLocaleLowerCase("pt-BR").includes(query),
    ),
  );
  const noMatches = data.items.length > 0 && filtered.length === 0;

  async function confirmRemove() {
    if (!removing || data.pending) return;
    setRemoveError("");
    try {
      await data.remove(removing.id);
      setNotice("Parâmetro removido com sucesso.");
      setRemoving(null);
    } catch {
      setRemoveError("Não foi possível remover o parâmetro. Tente novamente.");
    }
  }

  return (
    <section className={styles.page} aria-label="Gestão de parâmetros">
      <nav className={styles.breadcrumb} aria-label="Localização">
        <Link href="/administracao/usuarios">Administração</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">Parâmetros Meteorológicos</span>
      </nav>
      <div className={`${styles.workspace} ${editor ? styles.withPanel : ""}`}>
        <div className={styles.content}>
          <div className={styles.heading}>
            <h2 ref={heading} tabIndex={-1}>Parâmetros Meteorológicos</h2>
            <p>Gerencie os tipos de medição disponíveis para os sensores.</p>
          </div>
          <div className={styles.toolbar} suppressHydrationWarning>
            <SearchInput
              label="Buscar parâmetros por nome ou unidade"
              placeholder="Buscar parâmetros..."
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              onClear={() => setTerm("")}
              disabled={data.status !== "success"}
            />
            <Button
              onClick={() => {
                setNotice("");
                setEditor({});
              }}
              disabled={
                data.status !== "success" || editor !== null || data.pending
              }
            >
              <Icon name="plus" />
              Novo parâmetro
            </Button>
          </div>
          {notice && (
            <p role="status" className={styles.notice}>
              <Icon name="info" />
              {notice}
            </p>
          )}
          {data.status === "loading" && (
            <div className={styles.state}>
              <FeedbackState kind="loading" title="Carregando parâmetros..." />
            </div>
          )}
          {data.status === "error" && (
            <div className={styles.state}>
              <FeedbackState
                kind="error"
                title="Não foi possível carregar os parâmetros."
                description="Tente novamente mais tarde."
              />
            </div>
          )}
          {data.status === "success" &&
            (filtered.length > 0 ? (
              <ParametersTable
                parameters={filtered}
                total={data.items.length}
                disabled={editor !== null || data.pending}
                onEdit={(parameter) => {
                  setNotice("");
                  setEditor({ parameter });
                }}
                onRemove={(parameter) => {
                  setNotice("");
                  setRemoveError("");
                  setRemoving(parameter);
                }}
              />
            ) : (
              <div className={styles.state}>
                <FeedbackState
                  kind="empty"
                  title={
                    noMatches
                      ? "Nenhum parâmetro encontrado."
                      : "Nenhum parâmetro cadastrado."
                  }
                  description={
                    noMatches
                      ? "Tente buscar por outro nome ou unidade de medida."
                      : "Adicione um parâmetro para começar."
                  }
                />
              </div>
            ))}
        </div>
        {editor && (
          <SidePanel
            title={editor.parameter ? "Editar parâmetro" : "Novo parâmetro"}
            description={
              editor.parameter
                ? "Atualize os dados do tipo de medição selecionado."
                : "Cadastre um novo tipo de medição para os sensores."
            }
            onClose={() => setEditor(null)}
            busy={data.pending}
          >
            <ParameterForm
              existing={data.items}
              parameter={editor.parameter}
              onCancel={() => setEditor(null)}
              onSave={async (values) => {
                await data.save(values, editor.parameter?.id);
                setNotice(
                  editor.parameter
                    ? "Parâmetro atualizado com sucesso."
                    : "Parâmetro cadastrado com sucesso.",
                );
                setTerm("");
                setEditor(null);
              }}
            />
          </SidePanel>
        )}
      </div>
      {removing && (
        <Modal
          title="Remover parâmetro?"
          returnFocus={() => heading.current}
          onClose={() => setRemoving(null)}
          busy={data.pending}
        >
          <p className={styles.confirmation}>
            Deseja remover <strong>{removing.nome}</strong> do catálogo de
            parâmetros?
          </p>
          {removeError && (
            <p className={styles.error} role="alert">
              {removeError}
            </p>
          )}
          <div className={styles.modalActions}>
            <Button
              variant="secondary"
              disabled={data.pending}
              onClick={() => setRemoving(null)}
            >
              Cancelar
            </Button>
            <Button disabled={data.pending} onClick={confirmRemove}>
              {data.pending ? "Removendo..." : "Confirmar remoção"}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
