"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { PortalLayout } from '@/components/layout/PortalLayout/PortalLayout'
import { SearchInput } from '@/components/ui/SearchInput/SearchInput'
import { Button } from '@/components/ui/Button/Button'
import { Icon } from '@/components/ui/Icon/Icon'
import { FeedbackState } from '@/components/ui/FeedbackState/FeedbackState'
import styles from './App.module.css'

import type {
  Station,
  StationFormValues,
} from '@/features/stations/types/station'
import { useStations } from '@/features/stations/hooks/useStations'


const statusLabel: Record<Station['status'], string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
}

const getCommunicationDelayText = (minutes: number | null) => {
  if (minutes === null) return 'Sem registro de comunicação'
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `Sem comunicação há ${hours} h${
    remainingMinutes > 0 ? ` e ${remainingMinutes} min` : ''
  }`
}

const initialForm: StationFormValues = {
  name: '',
  propertyId: '',
  macAddress: '',
  latitude: '',
  longitude: '',
  status: 'ativo',
}

const getStationSensors = (station: Station) => [
  {
    id: 1,
    localIdentifier: 'HUM-01',
    typeName: 'Umidade do Solo',
    unit: '%',
    operationalStatus: station.status === 'ativo',
    value: station.umidadeSolo !== undefined ? `${station.umidadeSolo}%` : '—',
    dataConsistent: true,
  },
  {
    id: 2,
    localIdentifier: 'TEMP-01',
    typeName: 'Temperatura do Solo',
    unit: '°C',
    operationalStatus: station.status === 'ativo',
    value: station.tempSolo !== undefined ? `${station.tempSolo}°C` : '—',
    dataConsistent: true,
  },
  {
    id: 3,
    localIdentifier: 'TEMPAR-01',
    typeName: 'Temperatura do Ar',
    unit: '°C',
    operationalStatus: station.status === 'ativo',
    value: station.tempAr !== undefined ? `${station.tempAr}°C` : '—',
    dataConsistent: true,
  },
  {
    id: 4,
    localIdentifier: 'WIND-01',
    typeName: 'Velocidade do Vento',
    unit: 'km/h',
    operationalStatus: station.status === 'ativo',
    value: station.status === 'ativo' ? '14.2 km/h' : '0.0 km/h',
    dataConsistent: true,
  },
  {
    id: 5,
    localIdentifier: 'RAIN-01',
    typeName: 'Sensor de Chuva',
    unit: 'mm',
    operationalStatus: station.status === 'ativo',
    value: '0.0 mm',
    dataConsistent: true,
  },
]

const getStationAlertConfigs = () => [
  {
    id: 1,
    sensorLocal: 'HUM-01',
    sensorName: 'Umidade do Solo',
    condition: '< 20.00 %',
    message: 'Umidade do solo em nível crítico',
    active: true,
  },
  {
    id: 2,
    sensorLocal: 'TEMPAR-01',
    sensorName: 'Temperatura do Ar',
    condition: '> 35.00 °C',
    message: 'Temperatura do ar acima do limite operacional',
    active: true,
  },
]

const StationTowerIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || styles.stationTowerIcon}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
    <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M12 14v8" />
    <path d="M9 22h6" />
  </svg>
)

const Page = () => {
  const {
    stations,
    properties,
    pagination,
    page,
    setPage,
    loading,
    error,
    search,
    setSearch,
    selectedStation,
    selectedStationId,
    setSelectedStationId,
    filteredStations,
    createStation,
    updateStation,
    deleteStation,
    refresh,
  } = useStations()

  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editForm, setEditForm] = useState<StationFormValues>(initialForm)
  const [editError, setEditError] = useState('')
  const [form, setForm] = useState<StationFormValues>(initialForm)
  const [formError, setFormError] = useState('')

  const handleFieldChange = (field: keyof StationFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditFieldChange = (field: keyof StationFormValues, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleToggleStatus = () => {
    setForm((prev) => ({
      ...prev,
      status: prev.status === 'ativo' ? 'inativo' : 'ativo',
    }))
  }

  const handleToggleEditStatus = () => {
    setEditForm((prev) => ({
      ...prev,
      status: prev.status === 'ativo' ? 'inativo' : 'ativo',
    }))
  }

  const handleCloseNewModal = () => {
    setIsNewModalOpen(false)
    setForm(initialForm)
    setFormError('')
  }

  const handleOpenStationDetail = (stationId: number) => {
    setSelectedStationId(stationId)
    setIsEditing(false)
    setIsConfirmingDelete(false)
    setIsDetailModalOpen(true)
  }

  const handleStartEdit = () => {
    if (!selectedStation) return
    setEditForm({
      name: selectedStation.name,
      propertyId: String(selectedStation.propertyId),
      macAddress: selectedStation.macAddress,
      latitude:
        selectedStation.latitude !== null && selectedStation.latitude !== undefined
          ? String(selectedStation.latitude)
          : '',
      longitude:
        selectedStation.longitude !== null && selectedStation.longitude !== undefined
          ? String(selectedStation.longitude)
          : '',
      status: selectedStation.status,
    })
    setEditError('')
    setIsEditing(true)
    setIsConfirmingDelete(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditError('')
  }

  const handleSaveEdit = async () => {
    if (!selectedStation) return
    if (!editForm.name.trim()) {
      setEditError('Informe o nome da estação.')
      return
    }
    if (!editForm.propertyId) {
      setEditError('Selecione a propriedade vinculada.')
      return
    }
    if (!editForm.macAddress.trim()) {
      setEditError('Informe o endereço MAC da estação.')
      return
    }

    setSubmitting(true)
    setEditError('')
    try {
      await updateStation(selectedStation.id, editForm)
      setIsEditing(false)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erro ao salvar alterações.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteStation = async () => {
    if (!selectedStation) return
    setSubmitting(true)
    try {
      await deleteStation(selectedStation.id)
      setIsDetailModalOpen(false)
      setIsConfirmingDelete(false)
      setIsEditing(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir estação.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateStation = async () => {
    if (!form.name.trim()) {
      setFormError('Informe o nome da estação.')
      return
    }
    if (!form.propertyId) {
      setFormError('Selecione a propriedade vinculada.')
      return
    }
    if (!form.macAddress.trim()) {
      setFormError('Informe o endereço MAC da estação.')
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      await createStation(form)
      handleCloseNewModal()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao criar estação.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PortalLayout title="Estações de Monitoramento">
      <div className={styles.mainContainer}>
        <div className={styles.topActionBar}>
          <SearchInput
            label="Filtrar estações"
            placeholder="Filtrar estações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />

          <Button
            variant="primary"
            onClick={() => setIsNewModalOpen(true)}
          >
            <Icon name="plus" />
            Nova Estação
          </Button>
        </div>

        <div className={styles.dashboardGrid}>
          <div className={styles.tableCard}>
            <div className={styles.tableResponsive}>
              <table className={styles.stationsTable}>
                <thead>
                  <tr>
                    <th className={styles.thId}>ESTAÇÃO</th>
                    <th>PROPRIEDADE</th>
                    <th>ENDEREÇO MAC</th>
                    <th>COORDENADAS</th>
                    <th>STATUS</th>
                    <th>ÚLTIMA COMUNICAÇÃO</th>
                    <th className={styles.thAction}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStations.map((station) => (
                    <tr
                      key={station.id}
                      className={
                        selectedStationId === station.id
                          ? styles.selectedRow
                          : styles.tableRow
                      }
                      onClick={() => handleOpenStationDetail(station.id)}
                      title="Clique para ver todas as informações da estação"
                    >
                      <td className={styles.cellId}>
                        <StationTowerIcon className={styles.rowWifiIcon} />
                        <span className={styles.idText}>{station.name}</span>
                      </td>

                      <td className={styles.cellPropriedade}>
                        {station.propriedade}
                      </td>

                      <td className={styles.cellMac}>
                        <code>{station.macAddress}</code>
                      </td>

                      <td className={styles.cellCoord}>
                        {station.latitude !== null && station.latitude !== undefined
                          ? station.latitude.toFixed(4)
                          : '—'}
                        ,{' '}
                        {station.longitude !== null && station.longitude !== undefined
                          ? station.longitude.toFixed(4)
                          : '—'}
                      </td>

                      <td className={styles.cellStatus}>
                        <span
                          className={`${styles.statusDotLabel} ${
                            styles[station.status]
                          }`}
                        >
                          <span className={styles.dotIndicator} />
                          {station.lastCommunicationMinutesAgo !== null &&
                            station.lastCommunicationMinutesAgo > 60 && (
                            <span
                              className={styles.communicationAlertIcon}
                              aria-label={`Alerta de comunicação da ${station.name}: ${getCommunicationDelayText(
                                station.lastCommunicationMinutesAgo,
                              ).toLowerCase()}`}
                              title={getCommunicationDelayText(
                                station.lastCommunicationMinutesAgo,
                              )}
                              data-tooltip={getCommunicationDelayText(
                                station.lastCommunicationMinutesAgo,
                              )}
                              tabIndex={0}
                            >
                              <Icon name="alert" />
                            </span>
                          )}
                          {statusLabel[station.status]}
                        </span>
                      </td>

                      <td className={styles.cellDate}>
                        {station.lastCommunicationAt}
                      </td>

                      <td
                        className={styles.cellChevron}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenStationDetail(station.id)
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {loading && stations.length === 0 && (
                <div style={{ padding: '24px 16px' }}>
                  <FeedbackState
                    kind="loading"
                    title="Carregando estações..."
                    description="Buscando informações do servidor."
                  />
                </div>
              )}

              {!loading && error && (
                <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <FeedbackState
                    kind="error"
                    title="Erro ao carregar estações"
                    description={error}
                  />
                  <Button variant="secondary" onClick={() => refresh()}>
                    Tentar novamente
                  </Button>
                </div>
              )}

              {!loading && !error && filteredStations.length === 0 && (
                <div style={{ padding: '24px 16px' }}>
                  <FeedbackState
                    kind="empty"
                    title="Nenhuma estação encontrada"
                    description={
                      search
                        ? `Nenhuma estação encontrada correspondente a "${search}".`
                        : "Nenhuma estação cadastrada no momento."
                    }
                  />
                </div>
              )}
            </div>

            <div className={styles.tableFooter}>
              <span className={styles.countInfo}>
                Mostrando {filteredStations.length} de {pagination.totalRecords || stations.length} estações
              </span>

              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  aria-label="Página anterior"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1 || loading}
                >
                  &lt;
                </button>
                <button
                  className={`${styles.pageBtn} ${styles.pageBtnActive}`}
                >
                  {pagination.currentPage || page}
                </button>
                <button
                  className={styles.pageBtn}
                  aria-label="Próxima página"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages || loading}
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>

          <aside className={styles.sidebarCards}>
            <div className={styles.sideCard}>
              <div className={styles.cardHeaderBetween}>
                <div className={styles.cardTitleWithIcon}>
                  <svg
                    className={styles.titleIcon}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  <h3>Alertas e notificações</h3>
                </div>
                <Link href="/alertas" className={styles.linkVerTodos}>
                  Ver todos &gt;
                </Link>
              </div>

              <div className={styles.alertsList}>
                <div className={styles.alertRow}>
                  <div className={`${styles.alertIconCircle} ${styles.bgAlertWarning}`}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </div>
                  <div className={styles.alertContent}>
                    <p className={styles.alertTitle}>
                      Estação 04 - Umidade do solo crítica
                    </p>
                    <p className={styles.alertSubtitle}>
                      Fazenda Boa Vista
                    </p>
                  </div>
                  <span className={styles.alertTime}>Há 12 min</span>
                </div>

                <div className={styles.alertRow}>
                  <div className={`${styles.alertIconCircle} ${styles.bgAlertDanger}`}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </div>
                  <div className={styles.alertContent}>
                    <p className={styles.alertTitle}>Estação 05 - Sem comunicação</p>
                    <p className={styles.alertSubtitle}>
                      Fazenda Boa Vista
                    </p>
                  </div>
                  <span className={styles.alertTime}>Há 40 min</span>
                </div>

                <div className={styles.alertRow}>
                  <div className={`${styles.alertIconCircle} ${styles.bgAlertDanger}`}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </div>
                  <div className={styles.alertContent}>
                    <p className={styles.alertTitle}>
                      Estação 08 - Limite de temperatura excedido
                    </p>
                    <p className={styles.alertSubtitle}>
                      Sítio Boa Vista
                    </p>
                  </div>
                  <span className={styles.alertTime}>Há 1 h</span>
                </div>

                <div className={styles.alertRow}>
                  <div className={`${styles.alertIconCircle} ${styles.bgAlertDark}`}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </div>
                  <div className={styles.alertContent}>
                    <p className={styles.alertTitle}>
                      Estação 12 - Falha de comunicação de dados
                    </p>
                    <p className={styles.alertSubtitle}>
                      Fazenda Santa Rita
                    </p>
                  </div>
                  <span className={styles.alertTime}>Há 2 h</span>
                </div>
              </div>
            </div>

            {selectedStation ? (
              <div
                className={`${styles.sideCard} ${styles.clickableSideCard}`}
                onClick={() => handleOpenStationDetail(selectedStation.id)}
                title="Clique para abrir todas as informações desta estação"
              >
                <div className={styles.telemetryCardHeader}>
                  <div className={styles.telemetryTitleGroup}>
                    <StationTowerIcon className={styles.telemetryWifiIcon} />
                    <span className={styles.telemetrySensorName}>
                      {selectedStation.name}
                    </span>
                    <span
                      className={`${styles.pillBadge} ${
                        styles[`pill-${selectedStation.status}`]
                      }`}
                    >
                      <span className={styles.dotIndicator} />
                      {statusLabel[selectedStation.status]}
                    </span>
                  </div>
                  <p className={styles.telemetryLocation}>
                    {selectedStation.propriedade} • MAC: {selectedStation.macAddress}
                  </p>
                </div>

                <div className={styles.telemetryBody}>
                  <div className={styles.telemetryImgWrapper}>
                    <svg
                      className={styles.stationGraphic}
                      viewBox="0 0 120 140"
                      preserveAspectRatio="xMidYMid slice"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect width="120" height="140" rx="10" fill="#eaf1ea" />
                      <rect width="120" height="90" rx="10" fill="#d8e8dc" />
                      <path
                        d="M0 80 Q30 75 60 80 T120 78 L120 140 L0 140 Z"
                        fill="#4f7a55"
                      />
                      <path
                        d="M0 92 Q40 87 80 92 T120 90 L120 140 L0 140 Z"
                        fill="#375d3c"
                      />
                      <rect x="58" y="24" width="4" height="78" fill="#7d9284" />
                      <line
                        x1="48"
                        y1="102"
                        x2="72"
                        y2="102"
                        stroke="#526857"
                        strokeWidth="3"
                      />
                      <polygon
                        points="42,38 58,34 58,46 42,50"
                        fill="#3a5a78"
                        stroke="#22394e"
                        strokeWidth="1"
                      />
                      <circle cx="60" cy="22" r="3" fill="#2d3d32" />
                      <line
                        x1="52"
                        y1="22"
                        x2="68"
                        y2="22"
                        stroke="#2d3d32"
                        strokeWidth="1.5"
                      />
                      <circle cx="52" cy="22" r="2.5" fill="#e74c3c" />
                      <circle cx="68" cy="22" r="2.5" fill="#e74c3c" />
                      <rect
                        x="64"
                        y="44"
                        width="10"
                        height="7"
                        rx="1"
                        fill="#ffffff"
                        stroke="#889c8e"
                      />
                    </svg>
                  </div>

                  <div className={styles.telemetryMetricsGridThree}>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Umidade do solo</span>
                      <span className={styles.metricValue}>
                        {selectedStation.umidadeSolo !== undefined
                          ? `${selectedStation.umidadeSolo}%`
                          : '32%'}
                      </span>
                      <span className={styles.metricVariationPos}>
                        {selectedStation.varUmidade || '↑ 2% (24h)'}
                      </span>
                    </div>

                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>
                        Temperatura do solo
                      </span>
                      <span className={styles.metricValue}>
                        {selectedStation.tempSolo !== undefined
                          ? `${selectedStation.tempSolo}°C`
                          : '23,4°C'}
                      </span>
                      <span className={styles.metricVariationPos}>
                        {selectedStation.varTempSolo || '↑ 0,8°C (24h)'}
                      </span>
                    </div>

                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>
                        Temperatura do ar
                      </span>
                      <span className={styles.metricValue}>
                        {selectedStation.tempAr !== undefined
                          ? `${selectedStation.tempAr}°C`
                          : '25,6°C'}
                      </span>
                      <span className={styles.metricVariationPos}>
                        {selectedStation.varTempAr || '↑ 1,2°C (24h)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.telemetryFooterClean}>
                  <div className={styles.lastUpdateWrapper}>
                    <StationTowerIcon className={styles.footerWifiIcon} />
                    <span>
                      Última comunicação: {selectedStation.lastCommunicationAt}
                    </span>
                  </div>
                  <span className={styles.openHint}>Clique para detalhes &gt;</span>
                </div>
              </div>
            ) : (
              <div className={styles.sideCard}>
                <div className={styles.telemetryCardHeader}>
                  <p className={styles.telemetryLocation}>
                    Nenhuma estação selecionada.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {isDetailModalOpen && selectedStation && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div
            className={styles.detailModalCardContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalTopNav}>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDetailModalOpen(false)
                  setIsEditing(false)
                  setIsConfirmingDelete(false)
                }}
              >
                ← Voltar para a lista
              </Button>

              <div className={styles.modalHeaderActions}>
                {!isEditing && !isConfirmingDelete && (
                  <>
                    <button
                      type="button"
                      className={styles.btnEditModal}
                      onClick={handleStartEdit}
                      title="Editar estação"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      type="button"
                      className={styles.btnDeleteModal}
                      onClick={() => setIsConfirmingDelete(true)}
                      title="Excluir estação"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      Excluir
                    </button>
                  </>
                )}

                <button
                  className={styles.modalCloseIconBtn}
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    setIsEditing(false)
                    setIsConfirmingDelete(false)
                  }}
                  title="Fechar"
                >
                  ✕
                </button>
              </div>
            </div>

            {isConfirmingDelete && (
              <div className={styles.confirmDeleteBox}>
                <h4 className={styles.confirmDeleteTitle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Confirmar Exclusão da Estação
                </h4>
                <p className={styles.confirmDeleteDesc}>
                  Tem certeza que deseja excluir a estação <strong>{selectedStation.name}</strong> (MAC: <code>{selectedStation.macAddress}</code>)?
                  Esta ação removerá a estação do monitoramento e não poderá ser desfeita.
                </p>
                <div className={styles.confirmDeleteActions}>
                  <Button
                    variant="secondary"
                    onClick={() => setIsConfirmingDelete(false)}
                  >
                    Cancelar
                  </Button>
                  <button
                    type="button"
                    className={styles.btnConfirmDelete}
                    onClick={handleDeleteStation}
                    disabled={submitting}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    {submitting ? 'Excluindo...' : 'Confirmar Exclusão'}
                  </button>
                </div>
              </div>
            )}

            {isEditing ? (
              <div className={styles.editFormContainer}>
                <div className={styles.modalHeadingGroup}>
                  <h2 className={styles.modalMainTitle}>Editar Estação #{selectedStation.id}</h2>
                  <p className={styles.modalSubtitle}>
                    Atualize os dados e configurações de operação da estação de monitoramento.
                  </p>
                </div>

                <div className={styles.formCardsGrid}>
                  <div className={styles.formBoxCard}>
                    <div className={styles.boxHeader}>
                      <div className={styles.boxIconWrapper}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
                          <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
                          <circle cx="12" cy="12" r="2" />
                          <path d="M12 14v8" />
                          <path d="M9 22h6" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={styles.boxTitle}>Dados da estação</h3>
                        <p className={styles.boxDesc}>Identificação e propriedade vinculada.</p>
                      </div>
                    </div>

                    <div className={styles.boxFields}>
                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Nome da estação <span className={styles.requiredStar}>*</span>
                        </label>
                        <div className={styles.inputWithIcon}>
                          <svg
                            className={styles.fieldIcon}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                            <line x1="7" y1="7" x2="7.01" y2="7" />
                          </svg>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => handleEditFieldChange('name', e.target.value)}
                            placeholder="Digite o nome da estação"
                          />
                        </div>
                      </div>

                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Propriedade <span className={styles.requiredStar}>*</span>
                        </label>
                        <div className={styles.inputWithIcon}>
                          <svg
                            className={styles.fieldIcon}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                          <select
                            value={editForm.propertyId}
                            onChange={(e) => handleEditFieldChange('propertyId', e.target.value)}
                          >
                            <option value="">Selecione a propriedade</option>
                            {properties.map((property) => (
                              <option key={property.id} value={property.id}>
                                {property.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Endereço MAC <span className={styles.requiredStar}>*</span>
                        </label>
                        <div className={styles.inputWithIcon}>
                          <svg
                            className={styles.fieldIcon}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                            <line x1="6" y1="6" x2="6.01" y2="6" />
                            <line x1="6" y1="18" x2="6.01" y2="18" />
                          </svg>
                          <input
                            type="text"
                            value={editForm.macAddress}
                            onChange={(e) => handleEditFieldChange('macAddress', e.target.value)}
                            placeholder="Ex: 00:1A:2B:3C:4D:13"
                          />
                        </div>
                      </div>

                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Status operacional <span className={styles.requiredStar}>*</span>
                        </label>
                        <div className={styles.toggleRow} onClick={handleToggleEditStatus}>
                          <div
                            className={`${styles.toggleSwitch} ${
                              editForm.status === 'ativo' ? styles.toggleOn : styles.toggleOff
                            }`}
                          >
                            <div className={styles.toggleThumb} />
                          </div>
                          <div className={styles.toggleTextGroup}>
                            <span className={styles.toggleLabel}>
                              {editForm.status === 'ativo' ? 'Estação ativa' : 'Estação inativa'}
                            </span>
                            <span className={styles.toggleDesc}>
                              {editForm.status === 'ativo'
                                ? 'A estação está enviando dados e leituras ao sistema.'
                                : 'A estação está pausada e não envia leituras.'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formBoxCard}>
                    <div className={styles.boxHeader}>
                      <div className={styles.boxIconWrapper}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={styles.boxTitle}>Localização geográfica</h3>
                        <p className={styles.boxDesc}>Coordenadas GPS de instalação.</p>
                      </div>
                    </div>

                    <div className={styles.boxFields}>
                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Latitude <span className={styles.requiredStar}>*</span>
                        </label>
                        <div className={styles.inputWithIcon}>
                          <svg
                            className={styles.fieldIcon}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                          <input
                            type="text"
                            value={editForm.latitude}
                            onChange={(e) => handleEditFieldChange('latitude', e.target.value)}
                            placeholder="Ex: -23.1791"
                          />
                        </div>
                      </div>

                      <div className={styles.formGroupItem}>
                        <label className={styles.fieldLabel}>
                          Longitude <span className={styles.requiredStar}>*</span>
                        </label>
                        <div className={styles.inputWithIcon}>
                          <svg
                            className={styles.fieldIcon}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="2" x2="12" y2="22" />
                            <path d="M2 12a15.3 15.3 0 0 1 10-4 15.3 15.3 0 0 1 10 4 15.3 15.3 0 0 1-10 4 15.3 15.3 0 0 1-10-4z" />
                          </svg>
                          <input
                            type="text"
                            value={editForm.longitude}
                            onChange={(e) => handleEditFieldChange('longitude', e.target.value)}
                            placeholder="Ex: -45.8872"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {editError && <p className={styles.formErrorMsg}>{editError}</p>}

                <div className={styles.modalBottomActions}>
                  <Button
                    variant="secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveEdit}
                    disabled={submitting}
                  >
                    {submitting ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.detailHeaderBlock}>
                  <div className={styles.detailTitleWithBadge}>
                    <div className={styles.stationBadgeIconLarge}>
                      <StationTowerIcon />
                    </div>
                    <div>
                      <div className={styles.detailNameRow}>
                        <h2 className={styles.detailStationTitle}>
                          {selectedStation.name}
                        </h2>
                        <span
                          className={`${styles.pillBadge} ${
                            styles[`pill-${selectedStation.status}`]
                          }`}
                        >
                          <span className={styles.dotIndicator} />
                          {statusLabel[selectedStation.status]}
                        </span>
                      </div>
                      <p className={styles.detailSubtext}>
                        Propriedade: <strong>{selectedStation.propriedade}</strong> • MAC: <code>{selectedStation.macAddress}</code>
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.detailSectionCard}>
                  <h3 className={styles.detailSectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    Dados da Estação e Localização
                  </h3>

                  <div className={styles.infoTilesGrid}>
                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>ID no Banco</span>
                      <span className={styles.infoTileValue}>#{selectedStation.id}</span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Nome da Estação</span>
                      <span className={styles.infoTileValue}>{selectedStation.name}</span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Propriedade (Fazenda)</span>
                      <span className={styles.infoTileValue}>{selectedStation.propriedade}</span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Endereço MAC</span>
                      <span className={styles.infoTileValue}>
                        <code>{selectedStation.macAddress}</code>
                      </span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Latitude</span>
                      <span className={styles.infoTileValue}>
                        {selectedStation.latitude !== null && selectedStation.latitude !== undefined
                          ? selectedStation.latitude.toFixed(6)
                          : '—'}
                      </span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Longitude</span>
                      <span className={styles.infoTileValue}>
                        {selectedStation.longitude !== null && selectedStation.longitude !== undefined
                          ? selectedStation.longitude.toFixed(6)
                          : '—'}
                      </span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Última Comunicação</span>
                      <span className={styles.infoTileValue}>{selectedStation.lastCommunicationAt}</span>
                    </div>

                    <div className={styles.infoTileItem}>
                      <span className={styles.infoTileLabel}>Data de Cadastro</span>
                      <span className={styles.infoTileValue}>{selectedStation.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.detailSectionCard}>
                  <h3 className={styles.detailSectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" />
                      <line x1="12" y1="2" x2="12" y2="4" />
                      <line x1="12" y1="20" x2="12" y2="22" />
                    </svg>
                    Sensores Instalados e Leituras Atuais
                  </h3>

                  <div className={styles.detailTableWrapper}>
                    <table className={styles.detailSensorsTable}>
                      <thead>
                        <tr>
                          <th>Identificador Local</th>
                          <th>Tipo de Sensor</th>
                          <th>Unidade</th>
                          <th>Última Leitura</th>
                          <th>Status Operacional</th>
                          <th>Consistência</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getStationSensors(selectedStation).map((s) => (
                          <tr key={s.id}>
                            <td>
                              <code>{s.localIdentifier}</code>
                            </td>
                            <td className={styles.boldCell}>{s.typeName}</td>
                            <td>{s.unit}</td>
                            <td className={styles.readingValueCell}>{s.value}</td>
                            <td>
                              <span
                                className={`${styles.statusDotLabel} ${
                                  s.operationalStatus ? styles.ativo : styles.inativo
                                }`}
                              >
                                <span className={styles.dotIndicator} />
                                {s.operationalStatus ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td>
                              <span className={styles.consistentBadge}>✓ Consistente</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.detailSectionCard}>
                  <h3 className={styles.detailSectionTitle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    Configurações de Alertas Ativas
                  </h3>

                  <div className={styles.alertConfigsList}>
                    {getStationAlertConfigs().map((rule) => (
                      <div key={rule.id} className={styles.alertRuleBox}>
                        <div className={styles.alertRuleLeft}>
                          <span className={styles.sensorCodeBadge}>{rule.sensorLocal}</span>
                          <div>
                            <p className={styles.ruleMsg}>{rule.message}</p>
                            <p className={styles.ruleCondition}>
                              Condição de disparo: <strong>{rule.sensorName} {rule.condition}</strong>
                            </p>
                          </div>
                        </div>
                        <span className={styles.ruleStatusActive}>● Regra Ativa</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.modalBottomActions}>
                  <Button
                    variant="secondary"
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    Fechar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isNewModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseNewModal}>
          <div
            className={styles.modalCardContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalTopNav}>
              <Button
                variant="secondary"
                onClick={handleCloseNewModal}
              >
                ← Voltar para a lista
              </Button>

              <button
                className={styles.modalCloseIconBtn}
                onClick={handleCloseNewModal}
                title="Fechar"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalHeadingGroup}>
              <h2 className={styles.modalMainTitle}>Criar Estação</h2>
              <p className={styles.modalSubtitle}>
                Preencha os dados da nova estação para conceder acesso e monitoramento ao sistema.
              </p>
            </div>

            <div className={styles.formCardsGrid}>
              <div className={styles.formBoxCard}>
                <div className={styles.boxHeader}>
                  <div className={styles.boxIconWrapper}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
                      <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
                      <circle cx="12" cy="12" r="2" />
                      <path d="M12 14v8" />
                      <path d="M9 22h6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.boxTitle}>Dados da estação</h3>
                    <p className={styles.boxDesc}>Informações básicas da estação.</p>
                  </div>
                </div>

                <div className={styles.boxFields}>
                  <div className={styles.formGroupItem}>
                    <label className={styles.fieldLabel}>
                      Nome da estação <span className={styles.requiredStar}>*</span>
                    </label>
                    <div className={styles.inputWithIcon}>
                      <svg
                        className={styles.fieldIcon}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                      </svg>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        placeholder="Digite o nome da estação"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroupItem}>
                    <label className={styles.fieldLabel}>
                      Propriedade <span className={styles.requiredStar}>*</span>
                    </label>
                    <div className={styles.inputWithIcon}>
                      <svg
                        className={styles.fieldIcon}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                      <select
                        value={form.propertyId}
                        onChange={(e) => handleFieldChange('propertyId', e.target.value)}
                      >
                        <option value="">Selecione a propriedade</option>
                        {properties.map((property) => (
                          <option key={property.id} value={property.id}>
                            {property.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroupItem}>
                    <label className={styles.fieldLabel}>
                      Endereço MAC <span className={styles.requiredStar}>*</span>
                    </label>
                    <div className={styles.inputWithIcon}>
                      <svg
                        className={styles.fieldIcon}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                        <line x1="6" y1="6" x2="6.01" y2="6"></line>
                        <line x1="6" y1="18" x2="6.01" y2="18"></line>
                      </svg>
                      <input
                        type="text"
                        value={form.macAddress}
                        onChange={(e) => handleFieldChange('macAddress', e.target.value)}
                        placeholder="Ex: 00:1A:2B:3C:4D:13"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroupItem}>
                    <label className={styles.fieldLabel}>
                      Status <span className={styles.requiredStar}>*</span>
                    </label>
                    <div className={styles.toggleRow} onClick={handleToggleStatus}>
                      <div
                        className={`${styles.toggleSwitch} ${
                          form.status === 'ativo' ? styles.toggleOn : styles.toggleOff
                        }`}
                      >
                        <div className={styles.toggleThumb} />
                      </div>
                      <div className={styles.toggleTextGroup}>
                        <span className={styles.toggleLabel}>
                          {form.status === 'ativo' ? 'Estação ativa' : 'Estação inativa'}
                        </span>
                        <span className={styles.toggleDesc}>
                          {form.status === 'ativo'
                            ? 'A estação poderá enviar dados e leituras ao sistema.'
                            : 'A estação não enviará leituras no momento.'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.formBoxCard}>
                <div className={styles.boxHeader}>
                  <div className={styles.boxIconWrapper}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.boxTitle}>Localização geográfica</h3>
                    <p className={styles.boxDesc}>Defina as coordenadas de instalação da estação.</p>
                  </div>
                </div>

                <div className={styles.boxFields}>
                  <div className={styles.formGroupItem}>
                    <label className={styles.fieldLabel}>
                      Latitude <span className={styles.requiredStar}>*</span>
                    </label>
                    <div className={styles.inputWithIcon}>
                      <svg
                        className={styles.fieldIcon}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                      <input
                        type="text"
                        value={form.latitude}
                        onChange={(e) => handleFieldChange('latitude', e.target.value)}
                        placeholder="Ex: -23.1791"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroupItem}>
                    <label className={styles.fieldLabel}>
                      Longitude <span className={styles.requiredStar}>*</span>
                    </label>
                    <div className={styles.inputWithIcon}>
                      <svg
                        className={styles.fieldIcon}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="2" x2="12" y2="22"></line>
                        <path d="M2 12a15.3 15.3 0 0 1 10-4 15.3 15.3 0 0 1 10 4 15.3 15.3 0 0 1-10 4 15.3 15.3 0 0 1-10-4z"></path>
                      </svg>
                      <input
                        type="text"
                        value={form.longitude}
                        onChange={(e) => handleFieldChange('longitude', e.target.value)}
                        placeholder="Ex: -45.8872"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {formError && <p className={styles.formErrorMsg}>{formError}</p>}

            <div className={styles.modalBottomActions}>
              <Button
                variant="secondary"
                onClick={handleCloseNewModal}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateStation}
                disabled={submitting}
              >
                <Icon name="plus" />
                {submitting ? 'Criando...' : 'Criar Estação'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  )
}

export default Page
