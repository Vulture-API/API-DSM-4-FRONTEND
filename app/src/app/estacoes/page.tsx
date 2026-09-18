"use client"
import React, { useState } from 'react'
import styles from './App.module.css'
import Image from 'next/image'

interface Station {
  name: string
  location: string
  status: 'online' | 'warning' | 'offline'
  temperature: number | null
  humidity: number | null
  sla: number
  lastCommunication: string
  latitude: number
  longitude: number
}

interface Datalogger {
  id: string
  online: boolean
}

interface Property {
  id: string
  name: string
}

interface NewStationForm {
  name: string
  propertyId: string
  dataloggerId: string
  macAddress: string
  latitude: string
  longitude: string
}

const initialStations: Station[] = [
  { name: 'Estação 01', location: 'Talhão Norte', status: 'online', temperature: 22, humidity: 74, sla: 99.8, lastCommunication: 'há 2 min', latitude: -23.1791, longitude: -45.8872 },
  { name: 'Estação 02', location: 'Divisa Leste', status: 'warning', temperature: 27, humidity: 58, sla: 96.4, lastCommunication: 'há 8 min', latitude: -23.1755, longitude: -45.8790 },
  { name: 'Estação A - Parreirais', location: 'Setor Sul', status: 'online', temperature: 24, humidity: 80, sla: 99.9, lastCommunication: 'há 1 min', latitude: -23.1830, longitude: -45.8825 },
  { name: 'Estação 03', location: 'Beira do Rio', status: 'offline', temperature: null, humidity: null, sla: 82.1, lastCommunication: 'há 3 h', latitude: -23.1702, longitude: -45.8760 },
  { name: 'Estação 04', location: 'Curral Velho', status: 'online', temperature: 23, humidity: 71, sla: 98.7, lastCommunication: 'há 4 min', latitude: -23.1868, longitude: -45.8901 },
  { name: 'Estação 05', location: 'Pivô Central', status: 'online', temperature: 25, humidity: 66, sla: 99.2, lastCommunication: 'há 6 min', latitude: -23.1810, longitude: -45.8845 },
  { name: 'Estação 06', location: 'Acesso Oeste', status: 'warning', temperature: 29, humidity: 49, sla: 94.0, lastCommunication: 'há 15 min', latitude: -23.1745, longitude: -45.8930 },
  { name: 'Estação 07', location: 'Sede Administrativa', status: 'online', temperature: 23, humidity: 69, sla: 99.5, lastCommunication: 'há 3 min', latitude: -23.1799, longitude: -45.8801 },
  { name: 'Estação 08', location: 'Fundo de Vale', status: 'online', temperature: 22, humidity: 77, sla: 99.1, lastCommunication: 'há 5 min', latitude: -23.1912, longitude: -45.8888 },
  { name: 'Estação 09', location: 'Barragem Sul', status: 'offline', temperature: null, humidity: null, sla: 78.6, lastCommunication: 'há 6 h', latitude: -23.1955, longitude: -45.8770 },
  { name: 'Estação 10', location: 'Talhão Leste', status: 'online', temperature: 24, humidity: 72, sla: 99.0, lastCommunication: 'há 4 min', latitude: -23.1680, longitude: -45.8850 },
  { name: 'Estação 11', location: 'Mirante', status: 'online', temperature: 21, humidity: 75, sla: 99.6, lastCommunication: 'há 2 min', latitude: -23.1729, longitude: -45.8919 },
]

const dataloggersMock: Datalogger[] = [
  { id: 'DL-001', online: true },
  { id: 'DL-002', online: false },
  { id: 'DL-003', online: true },
  { id: 'DL-004', online: true },
]

const propertiesMock: Property[] = [
  { id: '1', name: 'Fazenda Santa Rita' },
  { id: '2', name: 'Sítio Boa Vista' },
  { id: '3', name: 'Fazenda Água Limpa' },
]

const statusLabel: Record<Station['status'], string> = {
  online: 'Online',
  warning: 'Alerta',
  offline: 'Offline',
}

const initialForm: NewStationForm = {
  name: '',
  propertyId: '',
  dataloggerId: '',
  macAddress: '',
  latitude: '',
  longitude: '',
}

const macAddressPattern = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/

const Page = () => {
  const [stations, setStations] = useState<Station[]>(initialStations)
  const [search, setSearch] = useState('')
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [form, setForm] = useState<NewStationForm>(initialForm)
  const [formError, setFormError] = useState('')

  const filteredStations = stations.filter(station =>
    station.name.toLowerCase().includes(search.toLowerCase()) ||
    station.location.toLowerCase().includes(search.toLowerCase())
  )

  const handleFieldChange = (field: keyof NewStationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleCloseModal = () => {
    setIsNewModalOpen(false)
    setForm(initialForm)
    setFormError('')
  }

  const handleCreateStation = () => {
    if (!form.name.trim()) {
      setFormError('Informe o nome da estação.')
      return
    }
    if (!form.propertyId) {
      setFormError('Selecione a propriedade.')
      return
    }
    if (!form.dataloggerId) {
      setFormError('Selecione o Datalogger responsável.')
      return
    }
    if (!macAddressPattern.test(form.macAddress.trim())) {
      setFormError('Identificador MAC inválido. Formato esperado: AA:BB:CC:00:11:22')
      return
    }
    const lat = Number(form.latitude)
    const lng = Number(form.longitude)
    if (form.latitude.trim() === '' || Number.isNaN(lat) || lat < -90 || lat > 90) {
      setFormError('Latitude inválida. Use um valor entre -90 e 90.')
      return
    }
    if (form.longitude.trim() === '' || Number.isNaN(lng) || lng < -180 || lng > 180) {
      setFormError('Longitude inválida. Use um valor entre -180 e 180.')
      return
    }

    const property = propertiesMock.find(p => p.id === form.propertyId)

    const newStation: Station = {
      name: form.name.trim(),
      location: property ? property.name : '—',
      status: 'offline',
      temperature: null,
      humidity: null,
      sla: 0,
      lastCommunication: 'nunca',
      latitude: lat,
      longitude: lng,
    }

    setStations(prev => [...prev, newStation])
    handleCloseModal()
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.sidebarMock}></div>

      <div className={styles.mainArea}>
        <header className={styles.topHeader}>
          <h1 className={styles.title}>Estações de Monitoramento</h1>
          <div className={styles.headerWidgets}>
            <span className={styles.serverBadge}>
              <span className={styles.pontoVerde}></span>
              Servidor Ativo
            </span>
          </div>
        </header>

        <div className={styles.containerGeral}>
          <div className={styles.corpo}>
            <div className={styles.content}>
              <div className={styles.containerFilters}>
                <div className={styles.searchWrapper}>
                  <Image src="/images/lupa.png" alt="lupa" width={16} height={16} className={styles.searchIcon} />
                  <input
                    className={styles.filter}
                    type='text'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filtrar estações..."
                  />
                </div>
                <button className={styles.buttonNew} onClick={() => setIsNewModalOpen(true)}>
                  + Nova Estação
                </button>
              </div>

              <div className={styles.cardBox}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Estação</th>
                      <th>Local</th>
                      <th>Status</th>
                      <th>Temperatura</th>
                      <th>Umidade</th>
                      <th>SLA</th>
                      <th>Coordenadas</th>
                      <th>Última comunicação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStations.map((station, index) => (
                      <tr key={index}>
                        <td className={styles.fontWeightMedium}>{station.name}</td>
                        <td className={styles.mutedText}>{station.location}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[`badge-${station.status}`]}`}>
                            {statusLabel[station.status]}
                          </span>
                        </td>
                        <td>{station.temperature !== null ? `${station.temperature}°C` : '—'}</td>
                        <td>{station.humidity !== null ? `${station.humidity}%` : '—'}</td>
                        <td>{station.sla}%</td>
                        <td className={styles.coordCell}>{station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}</td>
                        <td className={styles.mutedCell}>{station.lastCommunication}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredStations.length === 0 && (
                  <p className={styles.emptyState}>Nenhuma estação encontrada para {search}.</p>
                )}
              </div>
            </div>

            <div className={styles.lateral}>
              <div className={styles.painelLateral}>
                <h2>Registradores (Dataloggers)</h2>
                {dataloggersMock.map((dl) => (
                  <div className={styles.linhaLateral} key={dl.id}>
                    <span className={styles.mutedText}>{dl.id}</span>
                    <span className={`${styles.statusTxt} ${dl.online ? styles.online : styles.offline}`}>
                      <span className={styles.ponto} />
                      {dl.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isNewModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Nova Estação</h2>

            <label>Nome</label>
            <input
              type='text'
              value={form.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder='Ex: Estação 05'
            />

            <label>Propriedade</label>
            <select
              value={form.propertyId}
              onChange={(e) => handleFieldChange('propertyId', e.target.value)}
            >
              <option value=''>Selecione uma propriedade</option>
              {propertiesMock.map((property) => (
                <option key={property.id} value={property.id}>{property.name}</option>
              ))}
            </select>

            <label>Datalogger</label>
            <select
              value={form.dataloggerId}
              onChange={(e) => handleFieldChange('dataloggerId', e.target.value)}
            >
              <option value=''>Selecione um datalogger</option>
              {dataloggersMock.map((dl) => (
                <option key={dl.id} value={dl.id}>
                  {dl.id} - {dl.online ? 'Online' : 'Offline'}
                </option>
              ))}
            </select>

            <label>Identificador MAC</label>
            <input
              type='text'
              value={form.macAddress}
              onChange={(e) => handleFieldChange('macAddress', e.target.value)}
              placeholder='Ex: AA:BB:CC:00:11:22'
            />

            <div className={styles.formRow}>
              <div>
                <label>Latitude</label>
                <input
                  type='text'
                  value={form.latitude}
                  onChange={(e) => handleFieldChange('latitude', e.target.value)}
                  placeholder='-23.1791'
                />
              </div>
              <div>
                <label>Longitude</label>
                <input
                  type='text'
                  value={form.longitude}
                  onChange={(e) => handleFieldChange('longitude', e.target.value)}
                  placeholder='-45.8872'
                />
              </div>
            </div>

            {formError && <p className={styles.formError}>{formError}</p>}

            <div className={styles.modalActions}>
              <button onClick={handleCloseModal}>Cancelar</button>
              <button onClick={handleCreateStation}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Page