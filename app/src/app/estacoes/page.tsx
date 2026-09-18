"use client"
import React, { useState } from 'react'
import styles from './App.module.css'

interface Station {
  id: number
  name: string
  propertyId: number
  propriedade: string
  macAddress: string
  latitude: number
  longitude: number
  status: 'ativo' | 'inativo'
  lastCommunicationAt: string
  createdAt: string
  umidadeSolo?: number
  varUmidade?: string
  tempSolo?: number
  varTempSolo?: string
  tempAr?: number
  varTempAr?: string
}

interface Property {
  id: number
  name: string
  location: string
}

interface NewStationForm {
  name: string
  propertyId: string
  macAddress: string
  latitude: string
  longitude: string
  status: 'ativo' | 'inativo'
}

const propertiesMock: Property[] = [
  { id: 1, name: 'Fazenda Santa Rita', location: 'São José dos Campos - SP' },
  { id: 2, name: 'Fazenda Boa Vista', location: 'Taubaté - SP' },
  { id: 3, name: 'Fazenda Esperança', location: 'Jacareí - SP' },
  { id: 4, name: 'Sítio Boa Vista', location: 'Caçapava - SP' },
  { id: 5, name: 'Fazenda Água Limpa', location: 'Pindamonhangaba - SP' },
]

const initialStations: Station[] = [
  {
    id: 1,
    name: 'Estação 01',
    propertyId: 1,
    propriedade: 'Fazenda Santa Rita',
    macAddress: '00:1A:2B:3C:4D:01',
    latitude: -23.1791,
    longitude: -45.8872,
    status: 'ativo',
    lastCommunicationAt: '10/06/2025 - 14:30',
    createdAt: '15/01/2025',
    umidadeSolo: 34,
    varUmidade: '↑ 1% (24h)',
    tempSolo: 22.8,
    varTempSolo: '↑ 0,4°C (24h)',
    tempAr: 24.5,
    varTempAr: '↑ 0,9°C (24h)',
  },
  {
    id: 2,
    name: 'Estação 02',
    propertyId: 1,
    propriedade: 'Fazenda Santa Rita',
    macAddress: '00:1A:2B:3C:4D:02',
    latitude: -23.1755,
    longitude: -45.879,
    status: 'ativo',
    lastCommunicationAt: '10/06/2025 - 14:28',
    createdAt: '18/01/2025',
    umidadeSolo: 29,
    varUmidade: '↓ 1% (24h)',
    tempSolo: 23.0,
    varTempSolo: '↑ 0,5°C (24h)',
    tempAr: 26.1,
    varTempAr: '↑ 1,5°C (24h)',
  },
  {
    id: 3,
    name: 'Estação 03',
    propertyId: 1,
    propriedade: 'Fazenda Santa Rita',
    macAddress: '00:1A:2B:3C:4D:03',
    latitude: -23.1702,
    longitude: -45.876,
    status: 'ativo',
    lastCommunicationAt: '10/06/2025 - 14:32',
    createdAt: '20/01/2025',
    umidadeSolo: 32,
    varUmidade: '↑ 2% (24h)',
    tempSolo: 23.4,
    varTempSolo: '↑ 0,8°C (24h)',
    tempAr: 25.6,
    varTempAr: '↑ 1,2°C (24h)',
  },
  {
    id: 4,
    name: 'Estação 04',
    propertyId: 2,
    propriedade: 'Fazenda Boa Vista',
    macAddress: '00:1A:2B:3C:4D:04',
    latitude: -23.1868,
    longitude: -45.8901,
    status: 'inativo',
    lastCommunicationAt: '10/06/2025 - 14:20',
    createdAt: '02/02/2025',
    umidadeSolo: 18,
    varUmidade: '↓ 8% (24h)',
    tempSolo: 27.2,
    varTempSolo: '↑ 2,1°C (24h)',
    tempAr: 29.4,
    varTempAr: '↑ 3,0°C (24h)',
  },
  {
    id: 5,
    name: 'Estação 05',
    propertyId: 2,
    propriedade: 'Fazenda Boa Vista',
    macAddress: '00:1A:2B:3C:4D:05',
    latitude: -23.181,
    longitude: -45.8845,
    status: 'inativo',
    lastCommunicationAt: '10/06/2025 - 13:52',
    createdAt: '05/02/2025',
    umidadeSolo: 14,
    varUmidade: '—',
    tempSolo: 28.0,
    varTempSolo: '—',
    tempAr: 30.1,
    varTempAr: '—',
  },
  {
    id: 6,
    name: 'Estação 06',
    propertyId: 3,
    propriedade: 'Fazenda Esperança',
    macAddress: '00:1A:2B:3C:4D:06',
    latitude: -23.1745,
    longitude: -45.893,
    status: 'ativo',
    lastCommunicationAt: '10/06/2025 - 14:31',
    createdAt: '12/02/2025',
    umidadeSolo: 38,
    varUmidade: '↑ 4% (24h)',
    tempSolo: 21.5,
    varTempSolo: '↓ 0,2°C (24h)',
    tempAr: 23.8,
    varTempAr: '↑ 0,5°C (24h)',
  },
  {
    id: 7,
    name: 'Estação 07',
    propertyId: 3,
    propriedade: 'Fazenda Esperança',
    macAddress: '00:1A:2B:3C:4D:07',
    latitude: -23.1799,
    longitude: -45.8801,
    status: 'ativo',
    lastCommunicationAt: '10/06/2025 - 14:27',
    createdAt: '15/02/2025',
    umidadeSolo: 35,
    varUmidade: '↑ 1% (24h)',
    tempSolo: 22.0,
    varTempSolo: '↑ 0,3°C (24h)',
    tempAr: 24.2,
    varTempAr: '↑ 0,8°C (24h)',
  },
  {
    id: 8,
    name: 'Estação 08',
    propertyId: 4,
    propriedade: 'Sítio Boa Vista',
    macAddress: '00:1A:2B:3C:4D:08',
    latitude: -23.1912,
    longitude: -45.8888,
    status: 'inativo',
    lastCommunicationAt: '10/06/2025 - 14:18',
    createdAt: '22/02/2025',
    umidadeSolo: 22,
    varUmidade: '↓ 5% (24h)',
    tempSolo: 25.4,
    varTempSolo: '↑ 1,6°C (24h)',
    tempAr: 27.8,
    varTempAr: '↑ 2,0°C (24h)',
  },
  {
    id: 9,
    name: 'Estação 09',
    propertyId: 4,
    propriedade: 'Sítio Boa Vista',
    macAddress: '00:1A:2B:3C:4D:09',
    latitude: -23.1955,
    longitude: -45.877,
    status: 'ativo',
    lastCommunicationAt: '10/06/2025 - 14:33',
    createdAt: '01/03/2025',
    umidadeSolo: 36,
    varUmidade: '↑ 3% (24h)',
    tempSolo: 22.5,
    varTempSolo: '↑ 0,6°C (24h)',
    tempAr: 24.9,
    varTempAr: '↑ 1,0°C (24h)',
  },
  {
    id: 10,
    name: 'Estação 10',
    propertyId: 5,
    propriedade: 'Fazenda Água Limpa',
    macAddress: '00:1A:2B:3C:4D:10',
    latitude: -23.168,
    longitude: -45.885,
    status: 'ativo',
    lastCommunicationAt: '10/06/2025 - 14:25',
    createdAt: '05/03/2025',
    umidadeSolo: 40,
    varUmidade: '↑ 2% (24h)',
    tempSolo: 21.8,
    varTempSolo: '↓ 0,4°C (24h)',
    tempAr: 23.5,
    varTempAr: '↑ 0,3°C (24h)',
  },
  {
    id: 11,
    name: 'Estação 11',
    propertyId: 5,
    propriedade: 'Fazenda Água Limpa',
    macAddress: '00:1A:2B:3C:4D:11',
    latitude: -23.1729,
    longitude: -45.8919,
    status: 'ativo',
    lastCommunicationAt: '10/06/2025 - 14:29',
    createdAt: '10/03/2025',
    umidadeSolo: 37,
    varUmidade: '↑ 1% (24h)',
    tempSolo: 22.3,
    varTempSolo: '↑ 0,2°C (24h)',
    tempAr: 24.0,
    varTempAr: '↑ 0,6°C (24h)',
  },
  {
    id: 12,
    name: 'Estação 12',
    propertyId: 1,
    propriedade: 'Fazenda Santa Rita',
    macAddress: '00:1A:2B:3C:4D:12',
    latitude: -23.184,
    longitude: -45.882,
    status: 'inativo',
    lastCommunicationAt: '10/06/2025 - 12:47',
    createdAt: '15/03/2025',
    umidadeSolo: 25,
    varUmidade: '—',
    tempSolo: 26.0,
    varTempSolo: '—',
    tempAr: 28.5,
    varTempAr: '—',
  },
]

const statusLabel: Record<Station['status'], string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
}

const initialForm: NewStationForm = {
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
  const [stations, setStations] = useState<Station[]>(initialStations)
  const [search, setSearch] = useState('')
  const [selectedStationId, setSelectedStationId] = useState<number>(3)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [form, setForm] = useState<NewStationForm>(initialForm)
  const [formError, setFormError] = useState('')

  const filteredStations = stations.filter(
    (station) =>
      station.name.toLowerCase().includes(search.toLowerCase()) ||
      station.propriedade.toLowerCase().includes(search.toLowerCase()) ||
      station.macAddress.toLowerCase().includes(search.toLowerCase()) ||
      statusLabel[station.status].toLowerCase().includes(search.toLowerCase())
  )

  const selectedStation =
    stations.find((s) => s.id === selectedStationId) || stations[0] || initialStations[2]

  const handleFieldChange = (field: keyof NewStationForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleToggleStatus = () => {
    setForm((prev) => ({
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
    setIsDetailModalOpen(true)
  }

  const handleCreateStation = () => {
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

    const lat = Number(form.latitude) || -23.1800
    const lng = Number(form.longitude) || -45.8850
    const prop = propertiesMock.find((p) => p.id === Number(form.propertyId))

    const nextId = stations.length > 0 ? Math.max(...stations.map((s) => s.id)) + 1 : 1

    const newStation: Station = {
      id: nextId,
      name: form.name.trim(),
      propertyId: prop ? prop.id : 1,
      propriedade: prop ? prop.name : 'Fazenda',
      macAddress: form.macAddress.trim().toUpperCase(),
      latitude: lat,
      longitude: lng,
      status: form.status,
      lastCommunicationAt: 'Agora mesmo',
      createdAt: 'Hoje',
      umidadeSolo: 32,
      varUmidade: '↑ 1% (24h)',
      tempSolo: 23.0,
      varTempSolo: '↑ 0,5°C (24h)',
      tempAr: 25.0,
      varTempAr: '↑ 1,0°C (24h)',
    }

    setStations((prev) => [newStation, ...prev])
    setSelectedStationId(newStation.id)
    handleCloseNewModal()
  }

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.topHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Estações de Monitoramento</h1>

          <div className={styles.headerRightActions}>
            <button
              className={styles.headerBellBtn}
              aria-label="Notificações"
              title="Notificações"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>

            <div className={styles.serverActiveBadge}>
              <span className={styles.serverDot} />
              <span>Servidor Ativo</span>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.mainContainer}>
        <div className={styles.topActionBar}>
          <div className={styles.searchWrapper}>
            <svg
              className={styles.searchIconSvg}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar estações..."
            />
          </div>

          <button
            className={styles.btnNewStation}
            onClick={() => setIsNewModalOpen(true)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nova Estação
          </button>
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
                        {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                      </td>

                      <td className={styles.cellStatus}>
                        <span
                          className={`${styles.statusDotLabel} ${
                            styles[station.status]
                          }`}
                        >
                          <span className={styles.dotIndicator} />
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

              {filteredStations.length === 0 && (
                <div className={styles.emptyState}>
                  <p>Nenhuma estação encontrada para &quot;{search}&quot;.</p>
                </div>
              )}
            </div>

            <div className={styles.tableFooter}>
              <span className={styles.countInfo}>
                Mostrando {filteredStations.length} de {stations.length} estações
              </span>

              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  aria-label="Página anterior"
                  disabled
                >
                  &lt;
                </button>
                <button
                  className={`${styles.pageBtn} ${styles.pageBtnActive}`}
                >
                  1
                </button>
                <button
                  className={styles.pageBtn}
                  aria-label="Próxima página"
                  disabled
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
                <button className={styles.linkVerTodos}>Ver todos &gt;</button>
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
          </aside>
        </div>
      </main>

      {isDetailModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div
            className={styles.detailModalCardContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalTopNav}>
              <button
                className={styles.btnVoltarLista}
                onClick={() => setIsDetailModalOpen(false)}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Voltar para a lista
              </button>

              <button
                className={styles.modalCloseIconBtn}
                onClick={() => setIsDetailModalOpen(false)}
                title="Fechar"
              >
                ✕
              </button>
            </div>

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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
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
                  <span className={styles.infoTileValue}>{selectedStation.latitude.toFixed(6)}</span>
                </div>

                <div className={styles.infoTileItem}>
                  <span className={styles.infoTileLabel}>Longitude</span>
                  <span className={styles.infoTileValue}>{selectedStation.longitude.toFixed(6)}</span>
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
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="4"></circle>
                  <line x1="12" y1="2" x2="12" y2="4"></line>
                  <line x1="12" y1="20" x2="12" y2="22"></line>
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
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
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
              <button
                className={styles.btnModalCancel}
                onClick={() => setIsDetailModalOpen(false)}
              >
                Fechar
              </button>
            </div>
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
              <button
                className={styles.btnVoltarLista}
                onClick={handleCloseNewModal}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Voltar para a lista
              </button>

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
                        {propertiesMock.map((property) => (
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

                  <div className={styles.requirementsList}>
                    <div className={styles.reqItem}>
                      <span className={styles.reqCheck}>✓</span>
                      <span>Coordenadas em formato decimal (WGS84)</span>
                    </div>
                    <div className={styles.reqItem}>
                      <span className={styles.reqCheck}>✓</span>
                      <span>Latitude válida entre -90.0000 e 90.0000</span>
                    </div>
                    <div className={styles.reqItem}>
                      <span className={styles.reqCheck}>✓</span>
                      <span>Longitude válida entre -180.0000 e 180.0000</span>
                    </div>
                    <div className={styles.reqItem}>
                      <span className={styles.reqCheck}>✓</span>
                      <span>Posicionamento automático no mapa do AgroVulture</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {formError && <p className={styles.formErrorMsg}>{formError}</p>}

            <div className={styles.modalBottomActions}>
              <button
                className={styles.btnModalCancel}
                onClick={handleCloseNewModal}
              >
                Cancelar
              </button>
              <button
                className={styles.btnModalSubmit}
                onClick={handleCreateStation}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Criar Estação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Page